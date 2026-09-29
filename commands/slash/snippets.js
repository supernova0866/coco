const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireSlashPermission } = require('../../core/slashGuard');
const { ValidationError } = require('../../core/errors');
const {
  insertSnippet,
  updateSnippet,
  deleteSnippet,
  fetchSnippetById,
  countSnippets,
  fetchSnippetsPage,
} = require('../../snippets/snippetStore');
const { reloadSnippetCache } = require('../../snippets/snippetCache');
const {
  parseIdList,
  parseTriggers,
  checkTriggerCollision,
  buildStoredMessage,
} = require('../../snippets/validate');
const {
  buildListContainer,
  buildNavRow,
  buildSingleContainer,
  buildSnippetModal,
  buildJumpModal,
} = require('../../snippets/panel');

const PAGE_SIZE = 5;
const PANEL_TIMEOUT_MS = 5 * 60 * 1000;

async function totalPagesNow() {
  return Math.max(1, Math.ceil((await countSnippets()) / PAGE_SIZE));
}

async function fetchOrThrow(id) {
  const row = await fetchSnippetById(id);
  if (!row) throw new ValidationError(`No snippet #${id} found.`);
  return row;
}

async function validateAndSave(idToUpdate, { scopeRaw, triggersRaw, messageRaw }, client) {
  const scopeIds = parseIdList(scopeRaw);
  const triggers = parseTriggers(triggersRaw);

  if (scopeIds.length === 0) return { ok: false, error: 'Provide at least one scope ID.' };
  if (triggers.length === 0) return { ok: false, error: 'Provide at least one trigger.' };

  const collision = await checkTriggerCollision(client, triggers);
  if (collision) return { ok: false, error: collision };

  const { isEmbed, message } = buildStoredMessage(messageRaw);

  if (idToUpdate) {
    await updateSnippet(idToUpdate, { scopeIds, triggers, message, isEmbed });
    await reloadSnippetCache();
    return { ok: true, id: idToUpdate };
  }

  const id = await insertSnippet({ scopeIds, triggers, message, isEmbed, createdBy: null });
  await reloadSnippetCache();
  return { ok: true, id };
}

module.exports = {
  permKeys: ['snippets_add', 'snippets_view', 'snippets_remove'],
  data: new SlashCommandBuilder()
    .setName('snippets')
    .setDescription('Manage auto-reply snippets')
    .addSubcommand((sub) => sub.setName('add').setDescription('Add a new snippet'))
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View snippets')
        .addIntegerOption((o) => o.setName('id').setDescription('Snippet ID').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a snippet')
        .addIntegerOption((o) => o.setName('id').setDescription('Snippet ID').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await requireSlashPermission(interaction, `snippets_${sub}`);

    if (sub === 'add') {
      await interaction.showModal(buildSnippetModal({ idForCustomId: 'new' }));
      const submit = await interaction
        .awaitModalSubmit({
          filter: (i) => i.customId === 'snippet_modal_new' && i.user.id === interaction.user.id,
          time: PANEL_TIMEOUT_MS,
        })
        .catch(() => null);
      if (!submit) return;

      const result = await validateAndSave(
        null,
        {
          scopeRaw: submit.fields.getTextInputValue('scope'),
          triggersRaw: submit.fields.getTextInputValue('triggers'),
          messageRaw: submit.fields.getTextInputValue('message'),
        },
        interaction.client
      );

      if (!result.ok) {
        await submit.reply({ content: result.error, ephemeral: true });
        return;
      }

      await submit.reply({ content: `Snippet #${result.id} created.`, ephemeral: true });
      return;
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      await fetchOrThrow(id);
      await deleteSnippet(id);
      await reloadSnippetCache();
      await interaction.reply({ content: `Removed snippet #${id}.`, ephemeral: true });
      return;
    }

    if (sub === 'view') {
      const id = interaction.options.getInteger('id');
      const invokerId = interaction.user.id;

      // currentView tracks what's on screen so the 5-minute timeout can
      // redraw the same layout with every button disabled.
      let currentView;

      if (id) {
        const row = await fetchOrThrow(id);
        currentView = { type: 'single', row, showBack: false };
      } else {
        const pages = await totalPagesNow();
        const rows = await fetchSnippetsPage(1, PAGE_SIZE);
        currentView = { type: 'list', rows, page: 1, totalPages: pages };
      }

      function render(disabled = false) {
        if (currentView.type === 'single') {
          return [buildSingleContainer(currentView.row, { showBack: currentView.showBack, disabled })];
        }
        return [
          buildListContainer(currentView.rows, disabled),
          buildNavRow(currentView.page, currentView.totalPages, disabled),
        ];
      }

      await interaction.reply({ components: render(), flags: MessageFlags.IsComponentsV2 });
      const message = await interaction.fetchReply();

      const collector = message.createMessageComponentCollector({ time: PANEL_TIMEOUT_MS });

      collector.on('collect', async (i) => {
        try {
          if (i.user.id !== invokerId) {
            await i.reply({ content: 'This is not your panel.', ephemeral: true });
            return;
          }

          if (i.customId.startsWith('snippet_view_')) {
            const targetId = Number(i.customId.replace('snippet_view_', ''));
            const row = await fetchSnippetById(targetId);
            if (!row) {
              await i.reply({ content: 'That snippet no longer exists.', ephemeral: true });
              return;
            }
            currentView = { type: 'single', row, showBack: true };
            await i.update({ components: render() });
            return;
          }

          if (i.customId === 'snippet_back') {
            const pages = await totalPagesNow();
            const rows = await fetchSnippetsPage(1, PAGE_SIZE);
            currentView = { type: 'list', rows, page: 1, totalPages: pages };
            await i.update({ components: render() });
            return;
          }

          if (i.customId === 'snippet_list_prev' || i.customId === 'snippet_list_next') {
            if (currentView.type !== 'list') return;
            const pages = await totalPagesNow();
            const nextPage =
              i.customId === 'snippet_list_prev'
                ? Math.max(1, currentView.page - 1)
                : Math.min(pages, currentView.page + 1);
            const rows = await fetchSnippetsPage(nextPage, PAGE_SIZE);
            currentView = { type: 'list', rows, page: nextPage, totalPages: pages };
            await i.update({ components: render() });
            return;
          }

          if (i.customId === 'snippet_list_jump') {
            await i.showModal(buildJumpModal());
            const submit = await i
              .awaitModalSubmit({
                filter: (m) => m.customId === 'snippet_list_jumpmodal' && m.user.id === invokerId,
                time: 60 * 1000,
              })
              .catch(() => null);
            if (!submit) return;

            const requested = Number(submit.fields.getTextInputValue('page'));
            const pages = await totalPagesNow();
            if (!Number.isInteger(requested) || requested < 1 || requested > pages) {
              await submit.reply({ content: `Enter a page between 1 and ${pages}.`, ephemeral: true });
              return;
            }

            const rows = await fetchSnippetsPage(requested, PAGE_SIZE);
            currentView = { type: 'list', rows, page: requested, totalPages: pages };
            await submit.update({ components: render() });
            return;
          }

          if (i.customId.startsWith('snippet_edit_')) {
            const targetId = Number(i.customId.replace('snippet_edit_', ''));
            const row = await fetchSnippetById(targetId);
            if (!row) {
              await i.reply({ content: 'That snippet no longer exists.', ephemeral: true });
              return;
            }

            await i.showModal(buildSnippetModal({ idForCustomId: targetId, existing: row }));
            const submit = await i
              .awaitModalSubmit({
                filter: (m) => m.customId === `snippet_modal_${targetId}` && m.user.id === invokerId,
                time: PANEL_TIMEOUT_MS,
              })
              .catch(() => null);
            if (!submit) return;

            const result = await validateAndSave(
              targetId,
              {
                scopeRaw: submit.fields.getTextInputValue('scope'),
                triggersRaw: submit.fields.getTextInputValue('triggers'),
                messageRaw: submit.fields.getTextInputValue('message'),
              },
              i.client
            );

            if (!result.ok) {
              await submit.reply({ content: result.error, ephemeral: true });
              return;
            }

            const updated = await fetchSnippetById(targetId);
            const showBack = currentView.type === 'single' ? currentView.showBack : false;
            currentView = { type: 'single', row: updated, showBack };
            await submit.update({ components: render() });
            return;
          }
        } catch (err) {
          console.error(err);
          await i.followUp({ content: 'Something went wrong running that.', ephemeral: true }).catch(() => {});
        }
      });

      collector.on('end', async () => {
        await message.edit({ components: render(true) }).catch(() => {});
      });
    }
  },
};

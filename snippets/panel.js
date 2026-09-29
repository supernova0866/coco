const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

function buildListContainer(rows, disabled = false) {
  const container = new ContainerBuilder();

  if (rows.length === 0) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('No snippets yet.'));
    return container;
  }

  for (const row of rows) {
    const summary = `#${row.id} - Scope: \`${row.scope_ids || 'Not set'}\`\nTriggers: ${row.triggers || 'Not set'}`;

    const button = new ButtonBuilder()
      .setCustomId(`snippet_view_${row.id}`)
      .setLabel('View')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled);

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(summary))
      .setButtonAccessory(button);

    container.addSectionComponents(section);
  }

  return container;
}

function buildNavRow(page, totalPages, disabled = false) {
  const prev = new ButtonBuilder()
    .setCustomId('snippet_list_prev')
    .setLabel('Prev')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || page <= 1);
  const jump = new ButtonBuilder()
    .setCustomId('snippet_list_jump')
    .setLabel(`Page ${page}/${totalPages}`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled);
  const next = new ButtonBuilder()
    .setCustomId('snippet_list_next')
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || page >= totalPages);

  return new ActionRowBuilder().addComponents(prev, jump, next);
}

function buildSingleContainer(row, { showBack = false, disabled = false } = {}) {
  const container = new ContainerBuilder();

  const text = new TextDisplayBuilder().setContent(
    `**Snippet #${row.id}**\n` +
      `Scope: \`${row.scope_ids || 'Not set'}\`\n` +
      `Triggers: ${row.triggers || 'Not set'}\n` +
      `Type: ${row.is_embed ? 'Embed JSON' : 'Plaintext'}\n` +
      `Message:\n\`\`\`${(row.message || '').slice(0, 1000)}\`\`\``
  );
  container.addTextDisplayComponents(text);

  const buttons = [];
  if (showBack) {
    buttons.push(
      new ButtonBuilder().setCustomId('snippet_back').setLabel('Back').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    );
  }
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`snippet_edit_${row.id}`)
      .setLabel('Edit')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );

  container.addActionRowComponents(new ActionRowBuilder().addComponents(buttons));
  return container;
}

function buildSnippetModal({ idForCustomId, existing = null }) {
  const scopeInput = new TextInputBuilder()
    .setCustomId('scope')
    .setLabel('Scope IDs (channel/category/guild, comma sep)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  if (existing?.scope_ids) scopeInput.setValue(existing.scope_ids);

  const triggersInput = new TextInputBuilder()
    .setCustomId('triggers')
    .setLabel('Triggers (comma separated)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  if (existing?.triggers) triggersInput.setValue(existing.triggers);

  const messageInput = new TextInputBuilder()
    .setCustomId('message')
    .setLabel('Message (plaintext or embed JSON)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);
  if (existing?.message) messageInput.setValue(existing.message);

  return new ModalBuilder()
    .setCustomId(`snippet_modal_${idForCustomId}`)
    .setTitle(existing ? `Edit Snippet #${existing.id}` : 'Add Snippet')
    .addComponents(
      new ActionRowBuilder().addComponents(scopeInput),
      new ActionRowBuilder().addComponents(triggersInput),
      new ActionRowBuilder().addComponents(messageInput)
    );
}

function buildJumpModal() {
  return new ModalBuilder()
    .setCustomId('snippet_list_jumpmodal')
    .setTitle('Jump to page')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('page')
          .setLabel('Page number')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
}

module.exports = {
  buildListContainer,
  buildNavRow,
  buildSingleContainer,
  buildSnippetModal,
  buildJumpModal,
};

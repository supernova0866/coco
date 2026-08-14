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
  MessageFlags,
} = require('discord.js');
const { client: db } = require('../../db/client');
const { fetchGate, buildGatePanelContainer, attachPanelCollector } = require('../../actiongates/panel');

const PAGE_SIZE = 5;

async function countGates() {
  const result = await db.execute('SELECT COUNT(*) as count FROM action_gates');
  return Number(result.rows[0].count);
}

async function fetchGatesPage(page) {
  const result = await db.execute({
    sql: 'SELECT * FROM action_gates ORDER BY id LIMIT ? OFFSET ?',
    args: [PAGE_SIZE, (page - 1) * PAGE_SIZE],
  });
  return result.rows;
}

function buildListContainer(gates) {
  const container = new ContainerBuilder();

  if (gates.length === 0) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('No action gates yet.'));
    return container;
  }

  for (const gate of gates) {
    const summary =
      `#${gate.id} - Channel: ${gate.channel_id ? `<#${gate.channel_id}>` : 'Not set'}\n` +
      `Contains: ${gate.contains || 'Not set'} Actions: ${gate.action || 'Not set'} Subactions: ${gate.subaction || 'Not set'}`;

    const button = new ButtonBuilder()
      .setCustomId(`gate_view_edit_${gate.id}`)
      .setLabel('Edit')
      .setStyle(ButtonStyle.Secondary);

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(summary))
      .setButtonAccessory(button);

    container.addSectionComponents(section);
  }

  return container;
}

function buildNavRow(listMsgId, page, totalPages) {
  const prev = new ButtonBuilder()
    .setCustomId(`agview_prev_${listMsgId}_${page}`)
    .setLabel('Prev')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 1);
  const jump = new ButtonBuilder()
    .setCustomId(`agview_jump_${listMsgId}_${page}`)
    .setLabel(`Page ${page}/${totalPages}`)
    .setStyle(ButtonStyle.Primary);
  const next = new ButtonBuilder()
    .setCustomId(`agview_next_${listMsgId}_${page}`)
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= totalPages);

  return new ActionRowBuilder().addComponents(prev, jump, next);
}

module.exports = {
  name: 'action gate view',
  permKey: 'action_gate_view',

  async execute(message) {
    const invokerId = message.author.id;
    let page = 1;
    let totalPages = Math.max(1, Math.ceil((await countGates()) / PAGE_SIZE));
    let gates = await fetchGatesPage(page);

    const listMsg = await message.channel.send({
      components: [buildListContainer(gates)],
      flags: MessageFlags.IsComponentsV2,
    });
    const navMsg = await message.channel.send({
      components: [new ContainerBuilder().addActionRowComponents(buildNavRow(listMsg.id, page, totalPages))],
      flags: MessageFlags.IsComponentsV2,
    });

    async function applyPage(newPage) {
      page = newPage;
      totalPages = Math.max(1, Math.ceil((await countGates()) / PAGE_SIZE));
      gates = await fetchGatesPage(page);
      await listMsg.edit({ components: [buildListContainer(gates)], flags: MessageFlags.IsComponentsV2 });
      await navMsg.edit({
        components: [new ContainerBuilder().addActionRowComponents(buildNavRow(listMsg.id, page, totalPages))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const listCollector = listMsg.createMessageComponentCollector({ time: 30 * 60 * 1000 });
    listCollector.on('collect', async (interaction) => {
      if (interaction.user.id !== invokerId) {
        await interaction.reply({ content: 'This is not your panel.', ephemeral: true });
        return;
      }

      const gateId = Number(interaction.customId.replace('gate_view_edit_', ''));
      const gate = await fetchGate(gateId);
      if (!gate) {
        await interaction.reply({ content: 'That gate no longer exists.', ephemeral: true });
        return;
      }

      await interaction.deferUpdate();
      const panel = await message.channel.send({
        components: [buildGatePanelContainer(gate)],
        flags: MessageFlags.IsComponentsV2,
      });
      attachPanelCollector(panel, invokerId, gateId, message.guild);
    });

    const navCollector = navMsg.createMessageComponentCollector({ time: 30 * 60 * 1000 });
    navCollector.on('collect', async (interaction) => {
      if (interaction.user.id !== invokerId) {
        await interaction.reply({ content: 'This is not your panel.', ephemeral: true });
        return;
      }

      const parts = interaction.customId.split('_');
      const action = parts[1];
      const currentPage = Number(parts[3]);

      if (action === 'jump') {
        const modal = new ModalBuilder()
          .setCustomId(`agview_jumpmodal_${listMsg.id}`)
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
        await interaction.showModal(modal);

        const submit = await interaction
          .awaitModalSubmit({
            filter: (i) => i.customId === `agview_jumpmodal_${listMsg.id}` && i.user.id === invokerId,
            time: 60 * 1000,
          })
          .catch(() => null);
        if (!submit) return;

        const requested = Number(submit.fields.getTextInputValue('page'));
        const totalNow = Math.max(1, Math.ceil((await countGates()) / PAGE_SIZE));
        if (!Number.isInteger(requested) || requested < 1 || requested > totalNow) {
          await submit.reply({ content: `Enter a page between 1 and ${totalNow}.`, ephemeral: true });
          return;
        }

        await applyPage(requested);
        await submit.reply({ content: `Jumped to page ${requested}.`, ephemeral: true });
        return;
      }

      const totalNow = Math.max(1, Math.ceil((await countGates()) / PAGE_SIZE));
      const newPage = action === 'prev' ? Math.max(1, currentPage - 1) : Math.min(totalNow, currentPage + 1);
      await interaction.deferUpdate();
      await applyPage(newPage);
    });
  },
};

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const { client: db } = require('../db/client');

async function fetchGate(id) {
  const result = await db.execute({ sql: 'SELECT * FROM action_gates WHERE id = ?', args: [id] });
  return result.rows[0] || null;
}

function buildGatePanelContainer(gate) {
  const container = new ContainerBuilder();
  const text = new TextDisplayBuilder().setContent(
    `**Action Gate #${gate.id}**\n` +
      `Channel: ${gate.channel_id ? `<#${gate.channel_id}>` : 'Not set'}\n` +
      `Contains: ${gate.contains || 'Not set'}\n` +
      `Actions: ${gate.action || 'Not set'}\n` +
      `Subactions: ${gate.subaction || 'Not set'}`
  );
  container.addTextDisplayComponents(text);

  const detectionBtn = new ButtonBuilder()
    .setCustomId(`gate_detection_${gate.id}`)
    .setLabel('Edit Detection')
    .setStyle(ButtonStyle.Secondary);
  const actionsBtn = new ButtonBuilder()
    .setCustomId(`gate_actions_${gate.id}`)
    .setLabel('Edit Actions')
    .setStyle(ButtonStyle.Secondary);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(detectionBtn, actionsBtn));
  return container;
}

function buildDetectionModal(gate) {
  const channelInput = new TextInputBuilder()
    .setCustomId('channel_id')
    .setLabel('Channel ID')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  if (gate.channel_id) channelInput.setValue(gate.channel_id);

  const containsInput = new TextInputBuilder()
    .setCustomId('contains')
    .setLabel('Contains, comma separated, ! for not')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  if (gate.contains) containsInput.setValue(gate.contains);

  return new ModalBuilder()
    .setCustomId(`gate_detection_modal_${gate.id}`)
    .setTitle(`Gate #${gate.id} Detection`)
    .addComponents(
      new ActionRowBuilder().addComponents(channelInput),
      new ActionRowBuilder().addComponents(containsInput)
    );
}

function buildActionsModal(gate) {
  const actionInput = new TextInputBuilder()
    .setCustomId('action')
    .setLabel('Actions')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);
  if (gate.action) actionInput.setValue(gate.action);

  const subactionInput = new TextInputBuilder()
    .setCustomId('subaction')
    .setLabel('Subactions')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  if (gate.subaction) subactionInput.setValue(gate.subaction);

  return new ModalBuilder()
    .setCustomId(`gate_actions_modal_${gate.id}`)
    .setTitle(`Gate #${gate.id} Actions`)
    .addComponents(
      new ActionRowBuilder().addComponents(actionInput),
      new ActionRowBuilder().addComponents(subactionInput)
    );
}

function attachPanelCollector(panelMessage, invokerId, gateId, guild) {
  const collector = panelMessage.createMessageComponentCollector({ time: 30 * 60 * 1000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== invokerId) {
      await interaction.reply({ content: 'This is not your panel.', ephemeral: true });
      return;
    }

    const gate = await fetchGate(gateId);
    if (!gate) {
      await interaction.reply({ content: 'This gate no longer exists.', ephemeral: true });
      return;
    }

    if (interaction.customId === `gate_detection_${gateId}`) {
      await interaction.showModal(buildDetectionModal(gate));
      const submit = await interaction
        .awaitModalSubmit({
          filter: (i) => i.customId === `gate_detection_modal_${gateId}` && i.user.id === invokerId,
          time: 2 * 60 * 1000,
        })
        .catch(() => null);
      if (!submit) return;

      const channelId = submit.fields.getTextInputValue('channel_id');
      const contains = submit.fields.getTextInputValue('contains');
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel) {
        await submit.reply({ content: 'That channel ID could not be found.', ephemeral: true });
        return;
      }

      await db.execute({
        sql: 'UPDATE action_gates SET channel_id = ?, contains = ? WHERE id = ?',
        args: [channelId, contains, gateId],
      });

      const updated = await fetchGate(gateId);
      await panelMessage.edit({ components: [buildGatePanelContainer(updated)], flags: MessageFlags.IsComponentsV2 });
      await submit.reply({ content: 'Detection updated.', ephemeral: true });
    }

    if (interaction.customId === `gate_actions_${gateId}`) {
      await interaction.showModal(buildActionsModal(gate));
      const submit = await interaction
        .awaitModalSubmit({
          filter: (i) => i.customId === `gate_actions_modal_${gateId}` && i.user.id === invokerId,
          time: 2 * 60 * 1000,
        })
        .catch(() => null);
      if (!submit) return;

      const action = submit.fields.getTextInputValue('action') || null;
      const subaction = submit.fields.getTextInputValue('subaction') || null;

      await db.execute({
        sql: 'UPDATE action_gates SET action = ?, subaction = ? WHERE id = ?',
        args: [action, subaction, gateId],
      });

      const updated = await fetchGate(gateId);
      await panelMessage.edit({ components: [buildGatePanelContainer(updated)], flags: MessageFlags.IsComponentsV2 });
      await submit.reply({ content: 'Actions updated.', ephemeral: true });
    }
  });
}

module.exports = { fetchGate, buildGatePanelContainer, attachPanelCollector };

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { banUser } = require('../moderation/banUser');
const { setStatus } = require('./reactionStatus');

const DELETE_OPTIONS = [
  { label: "Don't Delete Any", value: '0', name: 'nothing' },
  { label: 'Previous Hour', value: '3600', name: 'the previous hour' },
  { label: 'Previous 6 Hours', value: '21600', name: 'the previous 6 hours' },
  { label: 'Previous 12 Hours', value: '43200', name: 'the previous 12 hours' },
  { label: 'Previous 24 Hours', value: '86400', name: 'the previous 24 hours' },
  { label: 'Previous 3 Days', value: '259200', name: 'the previous 3 days' },
  { label: 'Previous 7 Days', value: '604800', name: 'the previous 7 days' },
];

async function runBanFlow({ channel, guild, targetId, reason, invokerId, statusMessage }) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`banflow_${targetId}_${Date.now()}`)
      .setPlaceholder('Select messages to delete')
      .addOptions(DELETE_OPTIONS.map((o) => ({ label: o.label, value: o.value })))
  );

  const panel = await channel.send({
    content: `Ban <@${targetId}>? Select how many messages to delete.`,
    components: [row],
  });

  const collector = panel.createMessageComponentCollector({ time: 60000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== invokerId) {
      await interaction.reply({ content: 'This is not your menu.', ephemeral: true });
      return;
    }

    const deleteMessageSeconds = Number(interaction.values[0]);
    const option = DELETE_OPTIONS.find((o) => o.value === interaction.values[0]);

    await banUser(guild, targetId, reason, invokerId, deleteMessageSeconds);
    await interaction.update({
      content: `User banned\nDeleted messages for past ${option.name}`,
      components: [],
    });

    if (statusMessage) await setStatus(statusMessage, 'success');
    collector.stop('done');
  });

  collector.on('end', async (collected, reason) => {
    if (reason !== 'done') {
      await panel.edit({ content: 'Ban selection timed out.', components: [] }).catch(() => {});
      if (statusMessage) await setStatus(statusMessage, 'failure');
    }
  });
}

module.exports = { runBanFlow };

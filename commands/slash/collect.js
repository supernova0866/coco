const { SlashCommandBuilder } = require('discord.js');
const { requireSlashPermission } = require('../../core/slashGuard');
const { claimPayout } = require('../../economy/currency/payout');

module.exports = {
  permKeys: ['collect'],
  data: new SlashCommandBuilder().setName('collect').setDescription('Collect your role payout'),

  async execute(interaction) {
    await requireSlashPermission(interaction, 'collect');

    const result = await claimPayout(interaction.member);

    if (result.status === 'none') {
      await interaction.reply('None of your roles have a payout.');
      return;
    }

    const resetTimestamp = Math.floor(result.nextResetMs / 1000);

    if (result.status === 'already') {
      await interaction.reply(`You have already collected today. Resets <t:${resetTimestamp}:R>.`);
      return;
    }

    const parts = [];
    if (result.shards > 0) parts.push(`${result.shards.toLocaleString('en-US')} Shards`);
    if (result.gems > 0) parts.push(`${result.gems.toLocaleString('en-US')} Gems`);

    await interaction.reply(`Collected ${parts.join(' and ')}. Next payout <t:${resetTimestamp}:R>.`);
  },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireSlashPermission } = require('../../core/slashGuard');
const { getTopBalances } = require('../../economy/currency/balance');
const { getTopNet } = require('../../economy/gambling/stats');

const TYPES = {
  shards: { title: 'Top Shards', load: () => getTopBalances('shards') },
  gems: { title: 'Top Gems', load: () => getTopBalances('gems') },
  coinflip: { title: 'Coinflip Net Winnings', load: () => getTopNet('coinflip') },
  snailgarden: { title: 'Snailgarden Net Winnings', load: () => getTopNet('snailgarden') },
};

module.exports = {
  permKeys: ['leaderboard'],
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the economy leaderboards')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Leaderboard to view')
        .setRequired(false)
        .addChoices(
          { name: 'Shards', value: 'shards' },
          { name: 'Gems', value: 'gems' },
          { name: 'Coinflip winnings', value: 'coinflip' },
          { name: 'Snailgarden winnings', value: 'snailgarden' }
        )
    ),

  async execute(interaction) {
    await requireSlashPermission(interaction, 'leaderboard');

    const type = TYPES[interaction.options.getString('type') || 'shards'];
    const rows = await type.load();

    if (rows.length === 0) {
      await interaction.reply('Nothing on this leaderboard yet.');
      return;
    }

    const lines = rows.map(
      (row, index) => `**${index + 1}.** <@${row.userId}> - ${row.amount.toLocaleString('en-US')}`
    );
    const embed = new EmbedBuilder().setTitle(type.title).setDescription(lines.join('\n'));

    await interaction.reply({ embeds: [embed] });
  },
};

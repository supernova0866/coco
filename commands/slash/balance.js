const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireSlashPermission } = require('../../core/slashGuard');
const { getBalance } = require('../../economy/currency/balance');

module.exports = {
  permKeys: ['balance'],
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('View your Shards and Gems')
    .addUserOption((o) => o.setName('user').setDescription('User to view').setRequired(false)),

  async execute(interaction) {
    await requireSlashPermission(interaction, 'balance');

    const target = interaction.options.getUser('user') || interaction.user;
    const { shards, gems } = await getBalance(target.id);

    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s Balance`)
      .addFields(
        { name: 'Shards', value: shards.toLocaleString('en-US'), inline: true },
        { name: 'Gems', value: gems.toLocaleString('en-US'), inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};

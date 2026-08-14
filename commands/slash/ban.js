const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireNativePermission } = require('../../core/slashGuard');
const { runBanFlow } = require('../../core/banFlow');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user')
    .addUserOption((o) => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the ban').setRequired(true)),

  async execute(interaction) {
    requireNativePermission(interaction, PermissionFlagsBits.BanMembers);

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();

    await runBanFlow({
      channel: interaction.channel,
      guild: interaction.guild,
      targetId: target.id,
      reason,
      invokerId: interaction.user.id,
    });
  },
};

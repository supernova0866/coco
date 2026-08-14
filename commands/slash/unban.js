const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireNativePermission } = require('../../core/slashGuard');
const { unbanUser } = require('../../moderation/unbanUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .addUserOption((o) => o.setName('user').setDescription('User to unban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the unban').setRequired(true)),

  async execute(interaction) {
    requireNativePermission(interaction, PermissionFlagsBits.BanMembers);

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    await unbanUser(interaction.guild, target.id, reason, interaction.user.id);
    await interaction.reply(`Unbanned ${target}.`);
  },
};

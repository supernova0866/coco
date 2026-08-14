const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireNativePermission } = require('../../core/slashGuard');
const { unmuteUser } = require('../../moderation/unmuteUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove a timeout from a user')
    .addUserOption((o) => o.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the unmute').setRequired(true)),

  async execute(interaction) {
    requireNativePermission(interaction, PermissionFlagsBits.ModerateMembers);

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    await unmuteUser(interaction.guild, target.id, reason, interaction.user.id);
    await interaction.reply(`Unmuted ${target}.`);
  },
};

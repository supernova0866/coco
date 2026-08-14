const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireNativePermission } = require('../../core/slashGuard');
const { kickUser } = require('../../moderation/kickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user')
    .addUserOption((o) => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the kick').setRequired(true)),

  async execute(interaction) {
    requireNativePermission(interaction, PermissionFlagsBits.KickMembers);

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    await kickUser(interaction.guild, target.id, reason);
    await interaction.reply(`Kicked ${target}.`);
  },
};

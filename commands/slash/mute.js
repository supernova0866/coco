const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireNativePermission } = require('../../core/slashGuard');
const { muteUser } = require('../../moderation/muteUser');
const { parseDuration } = require('../../core/durationParser');
const { ValidationError } = require('../../core/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user')
    .addUserOption((o) => o.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the mute').setRequired(true))
    .addStringOption((o) =>
      o.setName('duration').setDescription('How long, e.g. 2d, 6h, 30m').setRequired(true)
    ),

  async execute(interaction) {
    requireNativePermission(interaction, PermissionFlagsBits.ModerateMembers);

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const durationToken = interaction.options.getString('duration');
    const durationSeconds = parseDuration(durationToken);

    if (!durationSeconds) {
      throw new ValidationError('Duration must be in a format like 2d, 6h, 30m.');
    }

    const id = await muteUser(interaction.guild, target.id, reason, durationSeconds, interaction.user.id);
    await interaction.reply(`Muted ${target} (${id}) for ${durationToken}.`);
  },
};

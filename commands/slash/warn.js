const { SlashCommandBuilder } = require('discord.js');
const { warnUser } = require('../../moderation/warnUser');
const { parseDuration } = require('../../core/durationParser');
const { requireSlashPermission } = require('../../core/slashGuard');
const { ValidationError } = require('../../core/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption((o) => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warn').setRequired(true))
    .addStringOption((o) =>
      o.setName('duration').setDescription('How long the warn stays active, e.g. 7d, 12h').setRequired(true)
    ),

  async execute(interaction) {
    await requireSlashPermission(interaction, 'warn');

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const durationToken = interaction.options.getString('duration');
    const durationSeconds = parseDuration(durationToken);

    if (!durationSeconds) {
      throw new ValidationError('Duration must be in a format like 7d, 12h, 30m.');
    }

    const id = await warnUser(target.id, reason, durationSeconds, interaction.user.id);
    await interaction.reply(`Warned ${target} (${id}). Expires in ${durationToken}.`);
  },
};

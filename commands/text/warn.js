const { resolveTarget } = require('../../core/targetResolver');
const { parseDuration } = require('../../core/durationParser');
const { warnUser } = require('../../moderation/warnUser');
const { ValidationError } = require('../../core/errors');

module.exports = {
  name: 'warn',
  permKey: 'warn_text',

  async execute(message, args) {
    const { targetId, reason: firstPass } = await resolveTarget(message, args);

    const remaining = firstPass.split(/\s+/);
    const durationToken = remaining[0];
    const durationSeconds = parseDuration(durationToken);
    if (!durationSeconds) {
      throw new ValidationError('Duration is required, format like 7d, 12h, 30m.');
    }

    const reason = remaining.slice(1).join(' ') || 'No reason provided.';
    const id = await warnUser(targetId, reason, durationSeconds, message.author.id);

    await message.reply(`Warned <@${targetId}> (${id}). Expires in ${durationToken}.`);
  },
};

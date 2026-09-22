const { client } = require('../db/client');
const { generateUniqueId } = require('../core/idGenerator');
const { ValidationError } = require('../core/errors');

// Discord rejects a timeout longer than 28 days.
const MAX_TIMEOUT_SECONDS = 28 * 86400;

async function muteUser(guild, targetId, reason, durationSeconds, moderatorId) {
  if (!durationSeconds || durationSeconds <= 0) {
    throw new ValidationError('Mute duration must be greater than zero.');
  }
  if (durationSeconds > MAX_TIMEOUT_SECONDS) {
    throw new ValidationError('Mute duration cannot exceed 28 days.');
  }

  const id = await generateUniqueId('timeouts');
  const member = await guild.members.fetch(targetId);
  await member.timeout(durationSeconds * 1000, reason);

  const now = Date.now();
  await client.execute({
    sql: `INSERT INTO timeouts (id, user_id, reason, duration_seconds, expires_at, moderator_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, targetId, reason, durationSeconds, now + durationSeconds * 1000, moderatorId, now],
  });

  return id;
}

module.exports = { muteUser, MAX_TIMEOUT_SECONDS };

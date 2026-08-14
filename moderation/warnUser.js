const { client } = require('../db/client');
const { generateUniqueId } = require('../core/idGenerator');

async function warnUser(targetId, reason, durationSeconds, moderatorId) {
  const id = await generateUniqueId('warns');
  const now = Date.now();

  await client.execute({
    sql: `INSERT INTO warns (id, user_id, reason, duration_seconds, expires_at, moderator_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, targetId, reason, durationSeconds, now + durationSeconds * 1000, moderatorId, now],
  });

  return id;
}

module.exports = { warnUser };

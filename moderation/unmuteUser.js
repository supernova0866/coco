const { client } = require('../db/client');

async function unmuteUser(guild, targetId, reason, moderatorId) {
  const result = await client.execute({
    sql: `SELECT id FROM timeouts WHERE user_id = ? AND unmuted_by IS NULL ORDER BY created_at DESC LIMIT 1`,
    args: [targetId],
  });
  const row = result.rows[0];

  const member = await guild.members.fetch(targetId);
  await member.timeout(null, reason);

  if (row) {
    await client.execute({
      sql: `UPDATE timeouts SET unmuted_by = ?, unmuted_reason = ?, unmuted_at = ? WHERE id = ?`,
      args: [moderatorId, reason, Date.now(), row.id],
    });
  }

  return row ? row.id : null;
}

module.exports = { unmuteUser };

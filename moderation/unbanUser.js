const { client } = require('../db/client');

async function unbanUser(guild, targetId, reason, moderatorId) {
  const result = await client.execute({
    sql: `SELECT id FROM bans WHERE user_id = ? AND unbanned_by IS NULL ORDER BY created_at DESC LIMIT 1`,
    args: [targetId],
  });
  const row = result.rows[0];

  await guild.members.unban(targetId, reason);

  if (row) {
    await client.execute({
      sql: `UPDATE bans SET unbanned_by = ?, unbanned_reason = ?, unbanned_at = ? WHERE id = ?`,
      args: [moderatorId, reason, Date.now(), row.id],
    });
  }

  return row ? row.id : null;
}

module.exports = { unbanUser };

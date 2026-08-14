const { AuditLogEvent } = require('discord.js');
const { client: db } = require('../db/client');

module.exports = {
  name: 'guildBanRemove',
  once: false,
  async execute(ban, client) {
    const guild = ban.guild;
    const targetId = ban.user.id;

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 5 }).catch(() => null);
    if (!logs) return;

    const entry = logs.entries.find(
      (e) => e.target?.id === targetId && Date.now() - e.createdTimestamp < 5000
    );
    if (!entry) return;
    if (entry.executor?.id === client.user.id) return;

    const result = await db.execute({
      sql: 'SELECT id FROM bans WHERE user_id = ? AND unbanned_by IS NULL ORDER BY created_at DESC LIMIT 1',
      args: [targetId],
    });
    const row = result.rows[0];
    if (!row) return;

    await db.execute({
      sql: 'UPDATE bans SET unbanned_by = ?, unbanned_reason = ?, unbanned_at = ? WHERE id = ?',
      args: [entry.executor.id, entry.reason ?? null, Date.now(), row.id],
    });
  },
};

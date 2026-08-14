const { AuditLogEvent } = require('discord.js');
const { client: db } = require('../db/client');
const { getConfig } = require('../core/configHelper');

async function handleTimeoutRemoved(oldMember, newMember, client) {
  const targetId = newMember.id;
  const logs = await newMember.guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 })
    .catch(() => null);
  if (!logs) return;

  const entry = logs.entries.find(
    (e) =>
      e.target?.id === targetId &&
      Date.now() - e.createdTimestamp < 5000 &&
      e.changes?.some((c) => c.key === 'communication_disabled_until')
  );
  if (!entry) return;
  if (entry.executor?.id === client.user.id) return;

  const result = await db.execute({
    sql: 'SELECT id FROM timeouts WHERE user_id = ? AND unmuted_by IS NULL ORDER BY created_at DESC LIMIT 1',
    args: [targetId],
  });
  const row = result.rows[0];
  if (!row) return;

  await db.execute({
    sql: 'UPDATE timeouts SET unmuted_by = ?, unmuted_reason = ?, unmuted_at = ? WHERE id = ?',
    args: [entry.executor.id, entry.reason ?? null, Date.now(), row.id],
  });
}

async function handleBoosterRoleChange(oldMember, newMember) {
  const boosterRoleId = await getConfig('booster_role_id');
  if (!boosterRoleId) return;

  const hadRole = oldMember.roles.cache.has(boosterRoleId);
  const hasRole = newMember.roles.cache.has(boosterRoleId);
  if (hadRole === hasRole) return;

  const userId = newMember.id;
  const ownedRow = await db.execute({
    sql: 'SELECT * FROM booster_roles WHERE user_id = ?',
    args: [userId],
  });
  const owned = ownedRow.rows[0];

  if (hadRole && !hasRole && owned) {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO booster_grace (user_id, role_id, expires_at) VALUES (?, ?, ?)',
      args: [userId, owned.role_id, Date.now() + 7 * 86400 * 1000],
    });
  }

  if (!hadRole && hasRole) {
    await db.execute({ sql: 'DELETE FROM booster_grace WHERE user_id = ?', args: [userId] });
  }
}

module.exports = {
  name: 'guildMemberUpdate',
  once: false,
  async execute(oldMember, newMember, client) {
    const timeoutRemoved =
      oldMember.communicationDisabledUntilTimestamp && !newMember.communicationDisabledUntilTimestamp;
    if (timeoutRemoved) {
      await handleTimeoutRemoved(oldMember, newMember, client);
    }

    await handleBoosterRoleChange(oldMember, newMember);
  },
};

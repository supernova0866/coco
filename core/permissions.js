const { client } = require('../db/client');

const VALID_TABLES = ['text_perms', 'slash_perms'];

function inList(csv, id) {
  if (!csv) return false;
  return csv.split(',').map((s) => s.trim()).includes(id);
}

function hasAnyRole(member, csv) {
  if (!csv) return false;
  const roleIds = csv.split(',').map((s) => s.trim());
  return member.roles.cache.some((r) => roleIds.includes(r.id));
}

async function checkPermission(table, command, member, channelId) {
  if (!VALID_TABLES.includes(table)) {
    throw new Error(`Invalid permission table: ${table}`);
  }

  const result = await client.execute({
    sql: `SELECT * FROM ${table} WHERE command = ?`,
    args: [command],
  });
  const row = result.rows[0];

  const fields = row
    ? [
        row.channel_whitelist,
        row.role_whitelist,
        row.channel_blacklist,
        row.role_blacklist,
        row.user_whitelist,
        row.user_blacklist,
      ]
    : [];

  if (!row || fields.every((f) => !f)) {
    return { allowed: false, reason: 'No parameters to match against.' };
  }

  if (inList(row.user_blacklist, member.id)) {
    return { allowed: false, reason: 'Insufficient Permissions.' };
  }
  if (inList(row.user_whitelist, member.id)) {
    return { allowed: true };
  }
  if (inList(row.channel_blacklist, channelId)) {
    return { allowed: false, reason: 'Insufficient Permissions.' };
  }
  if (hasAnyRole(member, row.role_blacklist)) {
    return { allowed: false, reason: 'Insufficient Permissions.' };
  }
  if (row.channel_whitelist && !inList(row.channel_whitelist, channelId)) {
    return { allowed: false, reason: 'Insufficient Permissions.' };
  }
  if (row.role_whitelist && !hasAnyRole(member, row.role_whitelist)) {
    return { allowed: false, reason: 'Insufficient Permissions.' };
  }

  return { allowed: true };
}

module.exports = { checkPermission };

const { client } = require('../db/client');

const NATIVE_PERM_COMMANDS = ['ban', 'mute', 'unban', 'unmute', 'kick'];

async function resolveCommand(token) {
  const lower = token.toLowerCase();

  if (NATIVE_PERM_COMMANDS.includes(lower)) {
    return { command: lower, usesNativePerms: true };
  }

  const result = await client.execute({
    sql: 'SELECT command FROM aliases WHERE alias = ?',
    args: [lower],
  });
  const row = result.rows[0];

  if (row && NATIVE_PERM_COMMANDS.includes(row.command)) {
    return { command: row.command, usesNativePerms: true };
  }

  return null;
}

module.exports = { resolveCommand, NATIVE_PERM_COMMANDS };

const { client: db } = require('../db/client');

async function ensureRow(table, commandKey) {
  await db.execute({
    sql: `INSERT INTO ${table} (command, channel_whitelist, role_whitelist, channel_blacklist, role_blacklist, user_whitelist, user_blacklist)
          VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL)
          ON CONFLICT(command) DO NOTHING`,
    args: [commandKey],
  });
}

async function seedPermissionRows(client) {
  for (const command of client.slashCommands.values()) {
    if (!command.permKeys) continue;
    for (const key of command.permKeys) {
      await ensureRow('slash_perms', key);
    }
  }

  for (const command of client.textCommands.values()) {
    if (!command.permKey) continue;
    await ensureRow('text_perms', command.permKey);
  }
}

module.exports = { seedPermissionRows };

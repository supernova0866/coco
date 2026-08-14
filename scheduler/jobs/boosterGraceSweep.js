const { client: db } = require('../../db/client');

async function runBoosterGraceSweep(discordClient) {
  const result = await db.execute({ sql: 'SELECT * FROM booster_grace WHERE expires_at < ?', args: [Date.now()] });

  for (const row of result.rows) {
    const guild = discordClient.guilds.cache.first();
    if (guild) {
      await guild.roles.delete(row.role_id).catch(() => {});
    }
    await db.execute({ sql: 'DELETE FROM booster_roles WHERE user_id = ?', args: [row.user_id] });
    await db.execute({ sql: 'DELETE FROM booster_grace WHERE user_id = ?', args: [row.user_id] });
  }
}

module.exports = { runBoosterGraceSweep };

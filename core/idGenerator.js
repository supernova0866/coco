const { client } = require('../db/client');

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PREFIXES = { warns: 'W', timeouts: 'T', bans: 'B' };

function randomCode() {
  return Array.from({ length: 5 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');
}

async function generateUniqueId(table) {
  const prefix = PREFIXES[table];
  if (!prefix) throw new Error(`No ID prefix defined for table: ${table}`);

  let id;
  let exists = true;
  while (exists) {
    id = `${prefix}-${randomCode()}`;
    const result = await client.execute({
      sql: `SELECT 1 FROM ${table} WHERE id = ?`,
      args: [id],
    });
    exists = result.rows.length > 0;
  }
  return id;
}

module.exports = { generateUniqueId };

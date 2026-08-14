const { client } = require('../db/client');

async function getConfig(name) {
  const result = await client.execute({
    sql: 'SELECT value FROM config WHERE config_name = ?',
    args: [name],
  });
  return result.rows[0]?.value ?? null;
}

async function getPrefixes() {
  const value = await getConfig('prefixes');
  return value ? JSON.parse(value) : ['c!'];
}

module.exports = { getConfig, getPrefixes };

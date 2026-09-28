const { client: db } = require('../../db/client');

function assertAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
}

async function ensureUser(userId) {
  await db.execute({
    sql: 'INSERT INTO economy_users (user_id, created_at) VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING',
    args: [userId, Date.now()],
  });
}

async function getBalance(userId) {
  const result = await db.execute({
    sql: 'SELECT shards, gems FROM economy_users WHERE user_id = ?',
    args: [userId],
  });
  const row = result.rows[0];
  return { shards: Number(row?.shards ?? 0), gems: Number(row?.gems ?? 0) };
}

async function debitShards(userId, amount) {
  assertAmount(amount);
  const result = await db.execute({
    sql: 'UPDATE economy_users SET shards = shards - ? WHERE user_id = ? AND shards >= ?',
    args: [amount, userId, amount],
  });
  return result.rowsAffected > 0;
}

function creditStatement(userId, shards = 0, gems = 0) {
  assertAmount(shards);
  assertAmount(gems);
  return {
    sql: `INSERT INTO economy_users (user_id, shards, gems, created_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET shards = shards + excluded.shards, gems = gems + excluded.gems`,
    args: [userId, shards, gems, Date.now()],
  };
}

async function creditShards(userId, amount) {
  await db.execute(creditStatement(userId, amount, 0));
}

const CURRENCY_COLUMNS = new Map([
  ['shards', 'shards'],
  ['gems', 'gems'],
]);

async function getTopBalances(currency, limit = 10) {
  const column = CURRENCY_COLUMNS.get(currency);
  if (!column) throw new Error(`Unknown currency: ${currency}`);

  const result = await db.execute({
    sql: `SELECT user_id, ${column} AS amount FROM economy_users WHERE ${column} > 0 ORDER BY ${column} DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows.map((row) => ({ userId: row.user_id, amount: Number(row.amount) }));
}

module.exports = { ensureUser, getBalance, debitShards, creditStatement, creditShards, getTopBalances };

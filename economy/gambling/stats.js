const { client: db } = require('../../db/client');
const { creditStatement } = require('../currency/balance');

function statsStatement(userId, game, bet, payout) {
  const won = payout > bet ? 1 : 0;
  return {
    sql: `INSERT INTO economy_stats (user_id, game, wins, losses, wagered, net) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, game) DO UPDATE SET
            wins = wins + excluded.wins,
            losses = losses + excluded.losses,
            wagered = wagered + excluded.wagered,
            net = net + excluded.net`,
    args: [userId, game, won, 1 - won, bet, payout - bet],
  };
}

async function settleRound(userId, game, bet, payout) {
  const statements = [statsStatement(userId, game, bet, payout)];
  if (payout > 0) statements.unshift(creditStatement(userId, payout, 0));
  await db.batch(statements, 'write');
}

async function getTopNet(game, limit = 10) {
  const result = await db.execute({
    sql: 'SELECT user_id, net FROM economy_stats WHERE game = ? ORDER BY net DESC LIMIT ?',
    args: [game, limit],
  });
  return result.rows.map((row) => ({ userId: row.user_id, amount: Number(row.net) }));
}

module.exports = { settleRound, getTopNet };

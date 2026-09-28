const { client: db } = require('../../db/client');
const { ensureUser } = require('./balance');

const DAY_MS = 24 * 60 * 60 * 1000;

function currentDay(now = Date.now()) {
  return Math.floor(now / DAY_MS);
}

function nextResetMs(now = Date.now()) {
  return (currentDay(now) + 1) * DAY_MS;
}

async function calculatePayout(member) {
  const roleIds = [...member.roles.cache.keys()];
  if (roleIds.length === 0) return { shards: 0, gems: 0 };

  const placeholders = roleIds.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT COALESCE(SUM(shards), 0) AS shards, COALESCE(SUM(gems), 0) AS gems
          FROM role_payouts WHERE role_id IN (${placeholders})`,
    args: roleIds,
  });
  const row = result.rows[0];
  return { shards: Number(row.shards), gems: Number(row.gems) };
}

async function claimPayout(member) {
  const userId = member.id;
  const payout = await calculatePayout(member);
  if (payout.shards === 0 && payout.gems === 0) return { status: 'none' };

  await ensureUser(userId);

  const today = currentDay();
  const result = await db.execute({
    sql: `UPDATE economy_users
          SET shards = shards + ?, gems = gems + ?, last_claim_day = ?
          WHERE user_id = ? AND last_claim_day < ?`,
    args: [payout.shards, payout.gems, today, userId, today],
  });

  if (result.rowsAffected === 0) {
    return { status: 'already', nextResetMs: nextResetMs() };
  }
  return { status: 'claimed', shards: payout.shards, gems: payout.gems, nextResetMs: nextResetMs() };
}

module.exports = { currentDay, nextResetMs, calculatePayout, claimPayout };

const { client: db } = require('../../db/client');

const FIVE_DAYS_MS = 5 * 86400 * 1000;

async function runConfessionSweep() {
  const cutoff = Date.now() - FIVE_DAYS_MS;
  await db.execute({
    sql: 'UPDATE confessions SET author_id = NULL WHERE author_id IS NOT NULL AND created_at < ?',
    args: [cutoff],
  });
}

module.exports = { runConfessionSweep };

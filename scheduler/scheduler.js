const { runConfessionSweep } = require('./jobs/confessionSweep');
const { runBoosterGraceSweep } = require('./jobs/boosterGraceSweep');

const INTERVAL_MS = 24 * 60 * 60 * 1000;

async function runSweeps(client) {
  await runConfessionSweep().catch((err) => console.error(err));
  await runBoosterGraceSweep(client).catch((err) => console.error(err));
}

function startScheduler(client) {
  runSweeps(client);
  setInterval(() => runSweeps(client), INTERVAL_MS);
}

module.exports = { startScheduler };

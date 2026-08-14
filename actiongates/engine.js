const { client: db } = require('../db/client');
const { evaluateContains } = require('./contains');
const { runActions } = require('./actions');
const { runSubactions } = require('./subactions');
const { runImport } = require('./imports');

async function fetchGatesForChannel(channelId) {
  const result = await db.execute({
    sql: 'SELECT * FROM action_gates WHERE channel_id = ? ORDER BY id',
    args: [channelId],
  });
  return result.rows;
}

async function evaluateGates(message) {
  const gates = await fetchGatesForChannel(message.channel.id);

  for (const gate of gates) {
    if (!gate.contains) continue;
    if (!gate.action && !gate.import) continue;
    if (!evaluateContains(message, gate.contains)) continue;

    if (gate.import) {
      await runImport(message, gate.import);
      return { matched: true, deleted: false };
    }

    const { deleted } = await runActions(message, gate.action);
    if (gate.subaction) {
      await runSubactions(message, gate.subaction);
    }
    return { matched: true, deleted };
  }

  return { matched: false, deleted: false };
}

module.exports = { evaluateGates };

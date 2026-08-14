const { ActivityType } = require('discord.js');
const { client: db } = require('../db/client');

const ROTATE_INTERVAL_MS = 10 * 1000;

const TYPE_MAP = {
  playing: ActivityType.Playing,
  watching: ActivityType.Watching,
  listening: ActivityType.Listening,
  competing: ActivityType.Competing,
};

let currentIndex = 0;

async function tick(client) {
  const result = await db.execute('SELECT * FROM bot_statuses ORDER BY position, id');
  const rows = result.rows;
  if (rows.length === 0) return;

  currentIndex = currentIndex % rows.length;
  const row = rows[currentIndex];
  currentIndex++;

  client.user.setActivity(row.text, { type: TYPE_MAP[row.activity_type] ?? ActivityType.Playing });
}

function startStatusRotator(client) {
  tick(client).catch(() => {});
  setInterval(() => tick(client).catch(() => {}), ROTATE_INTERVAL_MS);
}

module.exports = { startStatusRotator };

require('dotenv').config();

const required = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'BOT_OWNER_ID',
  'TURSO_URL',
  'TURSO_TOKEN',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  ownerId: process.env.BOT_OWNER_ID,
  turso: {
    url: process.env.TURSO_URL,
    token: process.env.TURSO_TOKEN,
  },
  tursoCoord: {
    url: process.env.TURSO_COORD_URL,
    token: process.env.TURSO_COORD_TOKEN,
  },
  workerHmacSecret: process.env.WORKER_HMAC_SECRET,
  logWebhookUrl: process.env.LOG_WEBHOOK_URL || null,
};

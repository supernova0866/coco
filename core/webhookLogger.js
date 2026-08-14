const config = require('../config');

async function logEvent(text) {
  if (!config.logWebhookUrl) return;

  await fetch(config.logWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  }).catch(() => {});
}

module.exports = { logEvent };

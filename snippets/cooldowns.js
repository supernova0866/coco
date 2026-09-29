const COOLDOWN_MS = 60 * 1000;
const expiries = new Map();

function keyFor(snippetId, channelId) {
  return `${snippetId}:${channelId}`;
}

function isOnCooldown(snippetId, channelId) {
  const key = keyFor(snippetId, channelId);
  const expiresAt = expiries.get(key);
  if (!expiresAt) return false;
  if (Date.now() >= expiresAt) {
    expiries.delete(key);
    return false;
  }
  return true;
}

function startCooldown(snippetId, channelId) {
  const key = keyFor(snippetId, channelId);
  const expiresAt = Date.now() + COOLDOWN_MS;
  expiries.set(key, expiresAt);
  setTimeout(() => {
    if (expiries.get(key) === expiresAt) expiries.delete(key);
  }, COOLDOWN_MS).unref();
}

module.exports = { isOnCooldown, startCooldown };

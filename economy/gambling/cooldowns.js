const { ValidationError } = require('../../core/errors');

const expiries = new Map();
const busy = new Set();

function keyFor(userId, game) {
  return `${game}:${userId}`;
}

function getRemainingMs(key) {
  const expiresAt = expiries.get(key);
  if (!expiresAt) return 0;
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) {
    expiries.delete(key);
    return 0;
  }
  return remaining;
}

function beginRound(userId, game) {
  const key = keyFor(userId, game);

  if (busy.has(key)) {
    throw new ValidationError('You already have a round in progress.');
  }

  const remaining = getRemainingMs(key);
  if (remaining > 0) {
    const readyAt = Math.ceil((Date.now() + remaining) / 1000);
    throw new ValidationError(`You can play again <t:${readyAt}:R>.`);
  }

  busy.add(key);
}

function endRound(userId, game, cooldownMs) {
  const key = keyFor(userId, game);
  busy.delete(key);

  if (!cooldownMs || cooldownMs <= 0) return;

  const expiresAt = Date.now() + cooldownMs;
  expiries.set(key, expiresAt);
  setTimeout(() => {
    if (expiries.get(key) === expiresAt) expiries.delete(key);
  }, cooldownMs).unref();
}

module.exports = { beginRound, endRound };

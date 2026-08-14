const UNIT_SECONDS = { hr: 3600, h: 3600, min: 60, m: 60, sec: 1, s: 1, d: 86400 };

function parseDuration(token) {
  if (!token) return null;
  const match = /^(\d+)(hr|h|min|m|sec|s|d)$/.exec(token.trim());
  if (!match) return null;
  return Number(match[1]) * UNIT_SECONDS[match[2]];
}

module.exports = { parseDuration };

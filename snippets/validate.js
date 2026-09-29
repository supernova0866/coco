const { getPrefixes } = require('../core/configHelper');

const PING_REGEX = /@(everyone|here)/g;

function parseIdList(raw) {
  if (!raw) return [];
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
}

function parseTriggers(raw) {
  if (!raw) return [];
  return [...new Set(raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

function escapePings(text) {
  return text.replace(PING_REGEX, '\\@$1');
}

// Only treat the input as an embed payload if it parses to an object/array.
// A bare string or number is technically valid JSON but almost certainly
// means the person just typed plaintext that happens to parse.
function tryParseEmbed(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  return parsed;
}

async function checkTriggerCollision(client, triggers) {
  const prefixes = await getPrefixes();
  for (const trigger of triggers) {
    for (const prefix of prefixes) {
      if (!trigger.startsWith(prefix)) continue;
      const name = trigger.slice(prefix.length);
      if (client.textCommands.has(name)) {
        return `Trigger "${trigger}" collides with the built-in command "${prefix}${name}".`;
      }
    }
  }
  return null;
}

// Decides how a raw modal submission should be stored.
// Embed JSON is stored as-is (mentions inside embeds don't ping anyone).
// Plaintext has @everyone/@here escaped before storage.
function buildStoredMessage(raw) {
  const embedData = tryParseEmbed(raw);
  if (embedData !== null) {
    return { isEmbed: true, message: JSON.stringify(embedData) };
  }
  return { isEmbed: false, message: escapePings(raw) };
}

module.exports = {
  parseIdList,
  parseTriggers,
  escapePings,
  tryParseEmbed,
  checkTriggerCollision,
  buildStoredMessage,
};

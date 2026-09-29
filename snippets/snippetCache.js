const { fetchAllSnippets } = require('./snippetStore');
const { tryParseEmbed } = require('./validate');

let triggerMap = new Map();

function normalizeRow(row) {
  return {
    id: row.id,
    scopeIds: row.scope_ids ? row.scope_ids.split(',').filter(Boolean) : [],
    triggers: row.triggers ? row.triggers.split(',').filter(Boolean) : [],
    message: row.message,
    isEmbed: !!row.is_embed,
    parsedEmbed: row.is_embed ? tryParseEmbed(row.message) : null,
  };
}

async function reloadSnippetCache() {
  const rows = await fetchAllSnippets();
  const map = new Map();
  for (const row of rows) {
    const snippet = normalizeRow(row);
    for (const trigger of snippet.triggers) {
      if (!map.has(trigger)) map.set(trigger, []);
      map.get(trigger).push(snippet);
    }
  }
  triggerMap = map;
}

// channel match = 3, category (parent) match = 2, guild-wide match = 1, no match = 0
function specificity(snippet, channel) {
  if (snippet.scopeIds.includes(channel.id)) return 3;
  if (channel.parentId && snippet.scopeIds.includes(channel.parentId)) return 2;
  if (channel.guild && snippet.scopeIds.includes(channel.guild.id)) return 1;
  return 0;
}

function findMatch(content, channel) {
  const normalized = content.trim().toLowerCase();
  if (!normalized) return null;

  const candidates = triggerMap.get(normalized);
  if (!candidates || candidates.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const snippet of candidates) {
    const score = specificity(snippet, channel);
    if (score > bestScore) {
      bestScore = score;
      best = snippet;
    }
  }
  return best;
}

module.exports = { reloadSnippetCache, findMatch };

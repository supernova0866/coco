const fs = require('fs');
const path = require('path');
const { runActionList } = require('../actiongates/actions');

let loadedResponders = [];

function matchesTrigger(msg, match) {
  const content = msg.content;
  if (match.type === 'exact') return content.trim() === match.value;
  if (match.type === 'contains') return content.toLowerCase().includes(match.value.toLowerCase());
  if (match.type === 'regex') {
    try {
      return new RegExp(match.value).test(content);
    } catch {
      return false;
    }
  }
  return false;
}

function loadResponders() {
  const manifestPath = path.join(__dirname, 'autoresponders.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  loadedResponders = [];
  for (const entry of manifest.responders) {
    if (!entry.enabled) continue;
    const modulePath = path.join(__dirname, 'modules', entry.path);
    delete require.cache[require.resolve(modulePath)];
    loadedResponders.push(require(modulePath));
  }
}

function getResponderByName(name) {
  return loadedResponders.find((r) => r.name === name) || null;
}

async function evaluateAutoresponders(msg) {
  for (const responder of loadedResponders) {
    if (responder.channels && !responder.channels.includes(msg.channel.id)) continue;
    if (matchesTrigger(msg, responder.match)) {
      const { deleted } = await runActionList(msg, responder.actions);
      return { matched: true, deleted };
    }
  }
  return { matched: false, deleted: false };
}

module.exports = { loadResponders, getResponderByName, evaluateAutoresponders };

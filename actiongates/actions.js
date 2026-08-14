const { splitQuoted, parseDirective } = require('./parseUtils');
const { parseDuration } = require('../core/durationParser');

function resolveEmoji(client, param) {
  if (/^\d+$/.test(param)) {
    return client.emojis.cache.get(param) || param;
  }
  return param;
}

function renderThreadName(template, msg) {
  const now = new Date();
  const dateStr = [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('/');

  return template
    .replace('<displayname>', msg.member?.displayName ?? msg.author.username)
    .replace('<time:d>', dateStr);
}

const ACTIONS = {
  delete: { execute: async (msg) => { await msg.delete(); } },
  react: { execute: async (msg, param) => { await msg.react(resolveEmoji(msg.client, param)); } },
  reply: { execute: async (msg, param) => { await msg.reply(param); } },
  wait: {
    execute: async (msg, param) => {
      const seconds = parseDuration(param);
      if (seconds) await new Promise((r) => setTimeout(r, seconds * 1000));
    },
  },
  thread: { execute: async (msg, param) => { await msg.startThread({ name: renderThreadName(param, msg) }); } },
};

async function runActionList(msg, tokens) {
  let deleted = false;
  for (const token of tokens) {
    const { type, rest } = parseDirective(token);
    const handler = ACTIONS[type];
    if (!handler) continue;
    await handler.execute(msg, rest);
    if (type === 'delete') {
      deleted = true;
      break;
    }
  }
  return { deleted };
}

async function runActions(msg, actionField) {
  if (!actionField) return { deleted: false };
  return runActionList(msg, splitQuoted(actionField, ','));
}

module.exports = { ACTIONS, runActions, runActionList, resolveEmoji, renderThreadName };

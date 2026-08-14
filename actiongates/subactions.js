const { splitQuoted, parseDirective } = require('./parseUtils');
const { parseDuration } = require('../core/durationParser');
const { banUser } = require('../moderation/banUser');
const { muteUser } = require('../moderation/muteUser');
const { kickUser } = require('../moderation/kickUser');

const SUBACTIONS = {
  add_role: { execute: async (msg, param) => { await msg.member.roles.add(param); } },
  kick: { execute: async (msg) => { await kickUser(msg.guild, msg.author.id, 'Action Gate'); } },
  ban: {
    execute: async (msg, param) => {
      const seconds = parseDuration(param) ?? 0;
      await banUser(msg.guild, msg.author.id, 'Action Gate', msg.client.user.id, seconds);
    },
  },
  mute: {
    execute: async (msg, param) => {
      const [reason, durationToken] = splitQuoted(param, '+');
      const durationSeconds = parseDuration(durationToken) ?? 0;
      await muteUser(msg.guild, msg.author.id, reason || 'Action Gate', durationSeconds, msg.client.user.id);
    },
  },
};

async function runSubactions(msg, subactionField) {
  if (!subactionField) return;
  const { type, rest } = parseDirective(subactionField);
  const handler = SUBACTIONS[type];
  if (handler) await handler.execute(msg, rest);
}

module.exports = { SUBACTIONS, runSubactions };

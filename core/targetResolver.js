const { NoTargetError } = require('./errors');

const MENTION_REGEX = /^<@!?(\d+)>$/;
const ID_REGEX = /^\d{15,25}$/;

async function resolveTarget(message, args) {
  const firstToken = args[0];

  if (firstToken) {
    const mentionMatch = MENTION_REGEX.exec(firstToken);
    if (mentionMatch) {
      return { targetId: mentionMatch[1], reason: args.slice(1).join(' ') };
    }
    if (ID_REGEX.test(firstToken)) {
      return { targetId: firstToken, reason: args.slice(1).join(' ') };
    }
  }

  if (message.reference) {
    const replied = await message.fetchReference().catch(() => null);
    if (replied) {
      return { targetId: replied.author.id, reason: args.join(' ') };
    }
  }

  throw new NoTargetError('No target specified. Mention a user, provide an ID, or reply to their message.');
}

module.exports = { resolveTarget };

const emojis = require('../emojis.json');

async function setStatus(message, key) {
  const targetId = emojis.status[key];
  const targetEmoji = message.client.emojis.cache.get(targetId);
  if (!targetEmoji) return;

  for (const [otherKey, id] of Object.entries(emojis.status)) {
    if (otherKey === key) continue;
    const reaction = message.reactions.cache.get(id);
    if (reaction?.me) {
      await reaction.users.remove(message.client.user.id).catch(() => {});
    }
  }

  await message.react(targetEmoji).catch(() => {});
}

module.exports = { setStatus };

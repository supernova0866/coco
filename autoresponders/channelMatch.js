function matchesChannel(msg, channels) {
  if (!channels || channels.length === 0) return true;

  const channelId = msg.channel.id;
  const categoryId = msg.channel.parentId ?? null;

  const excludes = [];
  const includes = [];
  for (const token of channels) {
    if (token.startsWith('!')) excludes.push(token.slice(1));
    else includes.push(token);
  }

  const isExcluded = excludes.includes(channelId) || Boolean(categoryId && excludes.includes(categoryId));
  if (isExcluded) return false;

  if (includes.length === 0) return true;
  return includes.includes(channelId) || Boolean(categoryId && includes.includes(categoryId));
}

module.exports = { matchesChannel };

async function kickUser(guild, targetId, reason) {
  const member = await guild.members.fetch(targetId);
  await member.kick(reason);
}

module.exports = { kickUser };

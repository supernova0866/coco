module.exports = {
  name: 'rule_break',
  match: { type: 'contains', value: 'discord.gg/' },
  channels: null,
  actions: ['reply+"Invite links are not allowed here."', 'delete'],
};

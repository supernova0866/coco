module.exports = {
  name: 'rule_break',
  match: { type: 'contains', value: 'discord.gg/' },
  channels: ["!1407682796780257330]",
  actions: ['reply+"Invite links are not allowed here."', 'delete'],
};

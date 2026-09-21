const config = require('../config');
const { parseHint, findMatches } = require('./hintMatcher');

const POKETWO_ID = '716390085896962058';

const NO_MATCH_MESSAGE =
  'No Match Found.\n' +
  'This is either due to the Pokémon being event or unaudited.\n' +
  '-# If you believe this is a non-event Pokémon, ping Nova in a reply to this message.';

function buildReply(matches) {
  if (matches.length === 0) return NO_MATCH_MESSAGE;
  if (matches.length === 1) return `The pokémon is\n\`${matches[0]}\``;
  return `The pokémon is one of\n${matches.map((name) => `\`${name}\``).join('\n')}`;
}

async function handlePokemonHint(message) {
  if (message.author.id !== POKETWO_ID) return;
  if (message.channelId !== config.poke2ChannelId) return;

  const hint = parseHint(message.content);
  if (!hint) return;

  await message.reply({
    content: buildReply(findMatches(hint)),
    allowedMentions: { repliedUser: false },
  });
}

module.exports = { handlePokemonHint };

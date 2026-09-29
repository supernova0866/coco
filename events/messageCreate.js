const { handleMessage } = require('../core/router');
const { evaluateGates } = require('../actiongates/engine');
const { evaluateAutoresponders } = require('../autoresponders/autoresponder');
const { handlePokemonHint } = require('../pokemon/pokemonListener');
const { findMatch } = require('../snippets/snippetCache');
const { isOnCooldown, startCooldown } = require('../snippets/cooldowns');
const { sendSnippet } = require('../snippets/sender');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) {
      await handlePokemonHint(message).catch((err) => console.error(err));
      return;
    }

    const gateResult = await evaluateGates(message).catch((err) => {
      console.error(err);
      return { matched: false, deleted: false };
    });
    if (gateResult.deleted) return;

    const responderResult = await evaluateAutoresponders(message).catch((err) => {
      console.error(err);
      return { matched: false, deleted: false };
    });
    if (responderResult.deleted) return;

    const snippetMatch = findMatch(message.content, message.channel);
    if (snippetMatch) {
      if (!isOnCooldown(snippetMatch.id, message.channel.id)) {
        startCooldown(snippetMatch.id, message.channel.id);
        await sendSnippet(message, snippetMatch);
      }
      return;
    }

    await handleMessage(message, client);
  },
};

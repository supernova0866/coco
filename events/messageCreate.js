const { handleMessage } = require('../core/router');
const { evaluateGates } = require('../actiongates/engine');
const { evaluateAutoresponders } = require('../autoresponders/autoresponder');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

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

    await handleMessage(message, client);
  },
};

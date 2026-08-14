const { PermissionError, ValidationError } = require('../core/errors');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      const isKnown = err instanceof PermissionError || err instanceof ValidationError;
      if (!isKnown) console.error(err);

      const payload = { content: isKnown ? err.message : 'Something went wrong running that.' };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};

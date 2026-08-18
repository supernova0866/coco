const { SlashCommandBuilder } = require('discord.js');
const { requireSlashPermission } = require('../../core/slashGuard');

module.exports = {
  permKeys: ['indicator_set'],
  data: new SlashCommandBuilder()
    .setName('indicator')
    .setDescription('Bot presence indicator commands')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set the presence indicator')
        .addStringOption((o) =>
          o
            .setName('status')
            .setDescription('Presence status')
            .setRequired(true)
            .addChoices(
              { name: 'Online', value: 'online' },
              { name: 'Idle', value: 'idle' },
              { name: 'Do Not Disturb', value: 'dnd' }
            )
        )
    ),

  async execute(interaction) {
    await requireSlashPermission(interaction, 'indicator_set');

    const status = interaction.options.getString('status');
    interaction.client.user.setPresence({ status });
    await interaction.reply(`Presence set to ${status}.`);
  },
};

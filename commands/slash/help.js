const { SlashCommandBuilder } = require('discord.js');
const { slashSections } = require('../../core/helpContent');
const { buildHelpEmbed } = require('../../core/helpEmbed');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all commands'),

  async execute(interaction) {
    await interaction.reply({ embeds: [buildHelpEmbed(slashSections, 'Hyperion Commands')] });
  },
};

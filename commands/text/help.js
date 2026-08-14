const { textSections } = require('../../core/helpContent');
const { buildHelpEmbed } = require('../../core/helpEmbed');

module.exports = {
  name: 'help',
  permKey: 'help',

  async execute(message) {
    await message.reply({ embeds: [buildHelpEmbed(textSections, 'Hyperion Text Commands')] });
  },
};

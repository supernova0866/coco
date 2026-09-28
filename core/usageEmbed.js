const { EmbedBuilder } = require('discord.js');

function buildUsageEmbed(err, prefix) {
  const embed = new EmbedBuilder()
    .setTitle('Invalid Usage')
    .setDescription(err.message)
    .addFields({ name: 'Usage', value: `> \`${prefix}${err.usage}\`` });

  if (err.example) {
    embed.addFields({ name: 'Example', value: `> \`${prefix}${err.example}\`` });
  }

  return embed;
}

module.exports = { buildUsageEmbed };

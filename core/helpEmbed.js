const { EmbedBuilder } = require('discord.js');

function buildHelpEmbed(sections, title) {
  const embed = new EmbedBuilder().setTitle(title);
  for (const section of sections) {
    const value = section.commands.map((c) => `\`${c.usage}\`\n${c.description}`).join('\n\n');
    embed.addFields({ name: section.category, value });
  }
  return embed;
}

module.exports = { buildHelpEmbed };

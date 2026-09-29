const { EmbedBuilder } = require('discord.js');

function buildEmbeds(parsedEmbed) {
  if (Array.isArray(parsedEmbed)) {
    return parsedEmbed.map((e) => new EmbedBuilder(e));
  }
  if (parsedEmbed.embeds && Array.isArray(parsedEmbed.embeds)) {
    return parsedEmbed.embeds.map((e) => new EmbedBuilder(e));
  }
  return [new EmbedBuilder(parsedEmbed)];
}

async function sendSnippet(message, snippet) {
  const allowedMentions = { parse: [], repliedUser: false };

  try {
    if (snippet.isEmbed && snippet.parsedEmbed) {
      const content = typeof snippet.parsedEmbed.content === 'string' ? snippet.parsedEmbed.content : undefined;
      const embeds = buildEmbeds(snippet.parsedEmbed);
      await message.reply({ content, embeds, allowedMentions });
      return;
    }

    await message.reply({ content: snippet.message, allowedMentions });
  } catch (err) {
    // Never let a malformed snippet crash the message handler.
    console.error(`Failed to send snippet #${snippet.id}:`, err);
  }
}

module.exports = { sendSnippet };

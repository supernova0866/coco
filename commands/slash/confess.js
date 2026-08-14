const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { client: db } = require('../../db/client');
const { getConfig } = require('../../core/configHelper');
const { ValidationError } = require('../../core/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Send an anonymous confession')
    .addStringOption((o) =>
      o.setName('confession').setDescription('What you want to confess').setRequired(true)
    ),

  async execute(interaction) {
    const text = interaction.options.getString('confession');

    const channelId = await getConfig('confession_channel_id');
    if (!channelId) {
      throw new ValidationError('Confession channel is not configured yet.');
    }

    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      throw new ValidationError('Configured confession channel could not be found.');
    }

    const now = Date.now();
    const result = await db.execute({
      sql: 'INSERT INTO confessions (author_id, content, channel_id, created_at) VALUES (?, ?, ?, ?)',
      args: [interaction.user.id, text, channelId, now],
    });
    const id = Number(result.lastInsertRowid);

    const embed = new EmbedBuilder()
      .setTitle(`Confession #${id}`)
      .setDescription(text)
      .setTimestamp(now);

    const sent = await channel.send({ embeds: [embed] });

    await db.execute({
      sql: 'UPDATE confessions SET message_id = ? WHERE id = ?',
      args: [sent.id, id],
    });

    await interaction.reply({ content: 'Confession sent.', ephemeral: true });
  },
};

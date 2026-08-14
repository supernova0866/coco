const { EmbedBuilder } = require('discord.js');
const { client: db } = require('../../db/client');
const { ValidationError } = require('../../core/errors');

const PURGE_WINDOW_MS = 5 * 86400 * 1000;

module.exports = {
  name: 'confession purge',
  permKey: 'confession_purge',

  async execute(message, args) {
    const id = Number(args[0]);
    const reason = args.slice(1).join(' ');

    if (!Number.isInteger(id)) {
      throw new ValidationError('Provide a valid confession number.');
    }
    if (!reason) {
      throw new ValidationError('A reason is required.');
    }

    const result = await db.execute({ sql: 'SELECT * FROM confessions WHERE id = ?', args: [id] });
    const row = result.rows[0];
    if (!row) {
      throw new ValidationError(`No confession #${id} found.`);
    }

    if (Date.now() - row.created_at > PURGE_WINDOW_MS) {
      throw new ValidationError('The purge window for this confession has closed.');
    }

    const channel = await message.guild.channels.fetch(row.channel_id).catch(() => null);
    const liveMessage = channel && row.message_id ? await channel.messages.fetch(row.message_id).catch(() => null) : null;

    if (liveMessage) {
      const embed = new EmbedBuilder()
        .setTitle(`Confession #${id}`)
        .setDescription(reason)
        .setTimestamp(row.created_at);
      await liveMessage.edit({ embeds: [embed] });
    }

    await db.execute({
      sql: 'UPDATE confessions SET purged = 1, purge_reason = ?, purged_by = ?, purged_at = ? WHERE id = ?',
      args: [reason, message.author.id, Date.now(), id],
    });

    await message.reply(`Purged Confession #${id}.`);
  },
};

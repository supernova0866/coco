const { client: db } = require('../../db/client');
const { ValidationError } = require('../../core/errors');

module.exports = {
  name: 'confession reveal',
  permKey: 'confession_reveal',

  async execute(message, args) {
    const id = Number(args[0]);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Provide a valid confession number.');
    }

    const result = await db.execute({ sql: 'SELECT * FROM confessions WHERE id = ?', args: [id] });
    const row = result.rows[0];
    if (!row) {
      throw new ValidationError(`No confession #${id} found.`);
    }

    if (!row.author_id) {
      await message.reply(`Confession #${id} has already been anonymized.`);
      return;
    }

    if (!row.revealed_by) {
      await db.execute({
        sql: 'UPDATE confessions SET revealed_by = ?, revealed_at = ? WHERE id = ?',
        args: [message.author.id, Date.now(), id],
      });
      await message.reply(`Confession #${id} was sent by <@${row.author_id}>.`);
      return;
    }

    await message.reply(
      `Confession #${id} was sent by <@${row.author_id}>.\n` +
        `This confession was first revealed by <@${row.revealed_by}>.`
    );
  },
};

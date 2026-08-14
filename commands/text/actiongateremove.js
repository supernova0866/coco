const { client: db } = require('../../db/client');
const { ValidationError } = require('../../core/errors');

module.exports = {
  name: 'action gate remove',
  permKey: 'action_gate_remove',

  async execute(message, args) {
    const id = Number(args[0]);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Provide a valid action gate ID.');
    }

    const result = await db.execute({ sql: 'SELECT id FROM action_gates WHERE id = ?', args: [id] });
    if (!result.rows[0]) {
      throw new ValidationError(`No action gate #${id} found.`);
    }

    await db.execute({ sql: 'DELETE FROM action_gates WHERE id = ?', args: [id] });
    await message.reply(`Removed Action Gate #${id}.`);
  },
};

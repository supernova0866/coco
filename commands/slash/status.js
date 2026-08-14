const { SlashCommandBuilder } = require('discord.js');
const { client: db } = require('../../db/client');
const { requireSlashPermission } = require('../../core/slashGuard');
const { ValidationError } = require('../../core/errors');
const { logEvent } = require('../../core/webhookLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Rotating bot status commands')
    .addSubcommand((sub) => sub.setName('list').setDescription('List all rotating statuses'))
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a rotating status')
        .addStringOption((o) => o.setName('text').setDescription('Status text').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('type')
            .setDescription('Activity type')
            .setRequired(true)
            .addChoices(
              { name: 'Playing', value: 'playing' },
              { name: 'Watching', value: 'watching' },
              { name: 'Listening', value: 'listening' },
              { name: 'Competing', value: 'competing' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a rotating status')
        .addIntegerOption((o) => o.setName('id').setDescription('Status ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Change a status\'s rotation position')
        .addIntegerOption((o) => o.setName('id').setDescription('Status ID').setRequired(true))
        .addIntegerOption((o) => o.setName('position').setDescription('New position').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await requireSlashPermission(interaction, `status_${sub}`);

    if (sub === 'list') {
      const result = await db.execute('SELECT * FROM bot_statuses ORDER BY position, id');
      if (result.rows.length === 0) {
        await interaction.reply('No rotating statuses set.');
        return;
      }
      const lines = result.rows.map((r) => `[${r.id}] (pos ${r.position}) ${r.activity_type}: ${r.text}`);
      await interaction.reply(lines.join('\n'));
      return;
    }

    if (sub === 'add') {
      const text = interaction.options.getString('text');
      const type = interaction.options.getString('type');

      const maxResult = await db.execute('SELECT MAX(position) as maxPos FROM bot_statuses');
      const nextPosition = (maxResult.rows[0].maxPos ?? 0) + 1;

      const result = await db.execute({
        sql: 'INSERT INTO bot_statuses (text, activity_type, position, created_at) VALUES (?, ?, ?, ?)',
        args: [text, type, nextPosition, Date.now()],
      });
      const id = Number(result.lastInsertRowid);

      await interaction.reply(`Added status #${id}.`);
      await logEvent(`Status #${id} added by <@${interaction.user.id}>: ${type} ${text}`);
      return;
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      const existing = await db.execute({ sql: 'SELECT id FROM bot_statuses WHERE id = ?', args: [id] });
      if (!existing.rows[0]) throw new ValidationError(`No status #${id} found.`);

      await db.execute({ sql: 'DELETE FROM bot_statuses WHERE id = ?', args: [id] });
      await interaction.reply(`Removed status #${id}.`);
      await logEvent(`Status #${id} removed by <@${interaction.user.id}>.`);
      return;
    }

    if (sub === 'edit') {
      const id = interaction.options.getInteger('id');
      const position = interaction.options.getInteger('position');

      const existing = await db.execute({ sql: 'SELECT id FROM bot_statuses WHERE id = ?', args: [id] });
      if (!existing.rows[0]) throw new ValidationError(`No status #${id} found.`);

      await db.execute({ sql: 'UPDATE bot_statuses SET position = ? WHERE id = ?', args: [position, id] });
      await interaction.reply(`Status #${id} moved to position ${position}.`);
      await logEvent(`Status #${id} moved to position ${position} by <@${interaction.user.id}>.`);
    }
  },
};

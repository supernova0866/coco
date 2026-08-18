const { SlashCommandBuilder } = require('discord.js');
const { client: db } = require('../../db/client');
const { requireSlashPermission } = require('../../core/slashGuard');

module.exports = {
  permKeys: ['mod_view_warn', 'mod_view_timeout', 'mod_view_ban'],
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation lookup commands')
    .addSubcommandGroup((group) =>
      group
        .setName('view')
        .setDescription('View moderation history for a user')
        .addSubcommand((sub) =>
          sub
            .setName('warn')
            .setDescription('View active warns')
            .addUserOption((o) => o.setName('user').setDescription('User to check').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('timeout')
            .setDescription('View active timeouts')
            .addUserOption((o) => o.setName('user').setDescription('User to check').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('ban')
            .setDescription('View active bans')
            .addUserOption((o) => o.setName('user').setDescription('User to check').setRequired(true))
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await requireSlashPermission(interaction, `mod_view_${sub}`);

    const target = interaction.options.getUser('user');

    if (sub === 'warn') {
      const all = await db.execute({
        sql: 'SELECT * FROM warns WHERE user_id = ? ORDER BY created_at DESC',
        args: [target.id],
      });
      const now = Date.now();
      const active = all.rows.filter((r) => r.expires_at > now);
      const inactiveCount = all.rows.length - active.length;

      const lines = active.map(
        (r) => `[${r.id}] ${r.reason} - expires <t:${Math.floor(r.expires_at / 1000)}:R>`
      );
      const body = [
        `Active Warns for ${target} (${active.length})`,
        ...lines,
        inactiveCount > 0 ? `${inactiveCount} inactive warns not shown.` : null,
      ].filter(Boolean);

      await interaction.reply(body.join('\n'));
      return;
    }

    if (sub === 'timeout') {
      const all = await db.execute({
        sql: 'SELECT * FROM timeouts WHERE user_id = ? ORDER BY created_at DESC',
        args: [target.id],
      });
      const now = Date.now();
      const active = all.rows.filter((r) => r.expires_at > now && !r.unmuted_by);
      const inactiveCount = all.rows.length - active.length;

      const lines = active.map(
        (r) => `[${r.id}] ${r.reason} - expires <t:${Math.floor(r.expires_at / 1000)}:R>`
      );
      const body = [
        `Active Timeouts for ${target} (${active.length})`,
        ...lines,
        inactiveCount > 0 ? `${inactiveCount} inactive timeouts not shown.` : null,
      ].filter(Boolean);

      await interaction.reply(body.join('\n'));
      return;
    }

    if (sub === 'ban') {
      const all = await db.execute({
        sql: 'SELECT * FROM bans WHERE user_id = ? ORDER BY created_at DESC',
        args: [target.id],
      });
      const active = all.rows.filter((r) => !r.unbanned_by);
      const inactiveCount = all.rows.length - active.length;

      const lines = active.map((r) => `[${r.id}] ${r.reason} - by <@${r.moderator_id}>`);
      const body = [
        `Active Bans for ${target} (${active.length})`,
        ...lines,
        inactiveCount > 0 ? `${inactiveCount} inactive bans not shown.` : null,
      ].filter(Boolean);

      await interaction.reply(body.join('\n'));
    }
  },
};

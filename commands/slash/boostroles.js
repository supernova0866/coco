const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { client: db } = require('../../db/client');
const { getConfig } = require('../../core/configHelper');
const { requireSlashPermission, isOwner } = require('../../core/slashGuard');
const { ValidationError, PermissionError } = require('../../core/errors');

const HEX_REGEX = /^#?[0-9A-Fa-f]{6}$/;

function normalizeHex(hex) {
  return hex.startsWith('#') ? hex : `#${hex}`;
}

function parseCsv(str) {
  return str ? str.split(',').filter(Boolean) : [];
}

async function getOwnedRow(userId) {
  const result = await db.execute({ sql: 'SELECT * FROM booster_roles WHERE user_id = ?', args: [userId] });
  return result.rows[0] || null;
}

async function handleCreate(interaction) {
  await requireSlashPermission(interaction, 'boostroles_create');

  const boosterRoleId = await getConfig('booster_role_id');
  if (!boosterRoleId) throw new ValidationError('Booster role is not configured yet.');
  if (!interaction.member.roles.cache.has(boosterRoleId)) {
    throw new ValidationError('You need to be boosting to create a booster role.');
  }

  const existing = await getOwnedRow(interaction.user.id);
  if (existing) throw new ValidationError('You already have a booster role.');

  const name = interaction.options.getString('name');
  const hex = interaction.options.getString('hex');
  if (!HEX_REGEX.test(hex)) throw new ValidationError('Hex must be a valid color, e.g. #ff8800.');
  const color = normalizeHex(hex);

  const role = await interaction.guild.roles.create({ name, color });

  const referenceRoleId = await getConfig('booster_role_position_reference_id');
  if (referenceRoleId) {
    const referenceRole = await interaction.guild.roles.fetch(referenceRoleId).catch(() => null);
    if (referenceRole) {
      await role.setPosition(referenceRole.position - 1).catch(() => {});
    }
  }

  await interaction.member.roles.add(role.id);

  await db.execute({
    sql: 'INSERT INTO booster_roles (user_id, role_id, name, hex_color, shared_with, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
    args: [interaction.user.id, role.id, name, color, Date.now()],
  });

  await interaction.reply(`Created ${role} for you.`);
}

async function handleEdit(interaction) {
  await requireSlashPermission(interaction, 'boostroles_edit');

  const row = await getOwnedRow(interaction.user.id);
  if (!row) throw new ValidationError("You don't have a booster role.");

  const name = interaction.options.getString('name');
  const hex = interaction.options.getString('hex');
  if (!HEX_REGEX.test(hex)) throw new ValidationError('Hex must be a valid color, e.g. #ff8800.');
  const color = normalizeHex(hex);

  await interaction.guild.roles.edit(row.role_id, { name, color });
  await db.execute({
    sql: 'UPDATE booster_roles SET name = ?, hex_color = ? WHERE user_id = ?',
    args: [name, color, interaction.user.id],
  });

  await interaction.reply('Booster role updated.');
}

async function handleShare(interaction) {
  await requireSlashPermission(interaction, 'boostroles_share');

  const row = await getOwnedRow(interaction.user.id);
  if (!row) throw new ValidationError("You don't have a booster role.");

  const action = interaction.options.getString('action');
  const users = [1, 2, 3, 4]
    .map((n) => interaction.options.getUser(`user${n}`))
    .filter(Boolean);
  if (users.length === 0) throw new ValidationError('Provide at least one user.');

  const current = parseCsv(row.shared_with);

  if (action === 'add') {
    const combined = [...new Set([...current, ...users.map((u) => u.id)])];
    if (combined.length > 4) {
      throw new ValidationError(`Can only share with up to 4 people (currently ${current.length}).`);
    }
    for (const u of users) {
      const member = await interaction.guild.members.fetch(u.id).catch(() => null);
      if (member) await member.roles.add(row.role_id);
    }
    await db.execute({
      sql: 'UPDATE booster_roles SET shared_with = ? WHERE user_id = ?',
      args: [combined.join(','), interaction.user.id],
    });
  } else {
    const remaining = current.filter((id) => !users.some((u) => u.id === id));
    for (const u of users) {
      const member = await interaction.guild.members.fetch(u.id).catch(() => null);
      if (member) await member.roles.remove(row.role_id);
    }
    await db.execute({
      sql: 'UPDATE booster_roles SET shared_with = ? WHERE user_id = ?',
      args: [remaining.join(','), interaction.user.id],
    });
  }

  await interaction.reply('Booster role sharing updated.');
}

async function handleView(interaction) {
  await requireSlashPermission(interaction, 'boostroles_view');

  const target = interaction.options.getUser('user') || interaction.user;
  const isSelf = target.id === interaction.user.id;
  const isAdmin =
    isOwner(interaction.user.id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (!isSelf && !isAdmin) {
    throw new PermissionError('You can only view your own booster role.');
  }

  const row = await getOwnedRow(target.id);
  if (!row) throw new ValidationError(`${isSelf ? 'You don\'t' : `${target.username} doesn't`} have a booster role.`);

  const shared = parseCsv(row.shared_with);
  const sharedText = shared.length ? shared.map((id) => `<@${id}>`).join(', ') : 'None';

  await interaction.reply(`<@&${row.role_id}> (${row.name}, ${row.hex_color})\nShared with: ${sharedText}`);
}

async function handleDelete(interaction) {
  await requireSlashPermission(interaction, 'boostroles_delete');

  const row = await getOwnedRow(interaction.user.id);
  if (!row) throw new ValidationError("You don't have a booster role.");

  await interaction.guild.roles.delete(row.role_id).catch(() => {});
  await db.execute({ sql: 'DELETE FROM booster_roles WHERE user_id = ?', args: [interaction.user.id] });

  await interaction.reply('Booster role deleted.');
}

module.exports = {
  permKeys: ['boostroles_create', 'boostroles_edit', 'boostroles_share', 'boostroles_view', 'boostroles_delete'],
  data: new SlashCommandBuilder()
    .setName('boostroles')
    .setDescription('Booster custom role commands')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create your booster role')
        .addStringOption((o) => o.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption((o) => o.setName('hex').setDescription('Hex color, e.g. ff8800').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Edit your booster role')
        .addStringOption((o) => o.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption((o) => o.setName('hex').setDescription('Hex color, e.g. ff8800').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('share')
        .setDescription('Share or unshare your booster role')
        .addStringOption((o) =>
          o
            .setName('action')
            .setDescription('Add or remove')
            .setRequired(true)
            .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })
        )
        .addUserOption((o) => o.setName('user1').setDescription('User').setRequired(true))
        .addUserOption((o) => o.setName('user2').setDescription('User').setRequired(false))
        .addUserOption((o) => o.setName('user3').setDescription('User').setRequired(false))
        .addUserOption((o) => o.setName('user4').setDescription('User').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View a booster role')
        .addUserOption((o) => o.setName('user').setDescription('User to view').setRequired(false))
    )
    .addSubcommand((sub) => sub.setName('delete').setDescription('Delete your booster role')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return handleCreate(interaction);
    if (sub === 'edit') return handleEdit(interaction);
    if (sub === 'share') return handleShare(interaction);
    if (sub === 'view') return handleView(interaction);
    if (sub === 'delete') return handleDelete(interaction);
  },
};

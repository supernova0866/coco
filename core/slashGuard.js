const config = require('../config');
const { checkPermission } = require('./permissions');
const { PermissionError } = require('./errors');

function isOwner(userId) {
  return userId === config.ownerId;
}

async function requireSlashPermission(interaction, commandKey) {
  if (isOwner(interaction.user.id)) return;
  const result = await checkPermission('slash_perms', commandKey, interaction.member, interaction.channelId);
  if (!result.allowed) throw new PermissionError(result.reason);
}

function requireNativePermission(interaction, flag) {
  if (isOwner(interaction.user.id)) return;
  if (!interaction.member.permissions.has(flag)) {
    throw new PermissionError('Insufficient Permissions.');
  }
}

module.exports = { requireSlashPermission, requireNativePermission, isOwner };

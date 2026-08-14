const { client } = require('../db/client');
const { generateUniqueId } = require('../core/idGenerator');

async function banUser(guild, targetId, reason, moderatorId, deleteMessageSeconds) {
  const id = await generateUniqueId('bans');
  await guild.members.ban(targetId, { reason, deleteMessageSeconds });

  await client.execute({
    sql: `INSERT INTO bans (id, user_id, reason, delete_message_seconds, moderator_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, targetId, reason, deleteMessageSeconds, moderatorId, Date.now()],
  });

  return id;
}

module.exports = { banUser };

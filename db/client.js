const { createClient } = require('@libsql/client');
const config = require('../config');

const client = createClient({
  url: config.turso.url,
  authToken: config.turso.token,
});

async function initSchema() {
  await client.execute(`CREATE TABLE IF NOT EXISTS config (
    config_name TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    last_updated_by TEXT,
    updated_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS aliases (
    alias TEXT PRIMARY KEY,
    command TEXT NOT NULL
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS action_gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT,
    contains TEXT,
    action TEXT,
    subaction TEXT,
    import TEXT,
    created_by TEXT,
    created_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS confessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id TEXT,
    content TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    created_at INTEGER NOT NULL,
    purged INTEGER DEFAULT 0,
    purge_reason TEXT,
    purged_by TEXT,
    purged_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS confession_viewers (
    user_id TEXT PRIMARY KEY
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS text_perms (
    command TEXT PRIMARY KEY,
    channel_whitelist TEXT,
    role_whitelist TEXT,
    channel_blacklist TEXT,
    role_blacklist TEXT,
    user_whitelist TEXT,
    user_blacklist TEXT
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS slash_perms (
    command TEXT PRIMARY KEY,
    channel_whitelist TEXT,
    role_whitelist TEXT,
    channel_blacklist TEXT,
    role_blacklist TEXT,
    user_whitelist TEXT,
    user_blacklist TEXT
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS warns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    moderator_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS timeouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    moderator_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    unmuted_by TEXT,
    unmuted_reason TEXT,
    unmuted_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS bans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    delete_message_seconds INTEGER,
    moderator_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    unbanned_by TEXT,
    unbanned_reason TEXT,
    unbanned_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS booster_roles (
    user_id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    name TEXT NOT NULL,
    hex_color TEXT NOT NULL,
    shared_with TEXT,
    created_at INTEGER NOT NULL
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS booster_grace (
    user_id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS bot_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`);
}

module.exports = { client, initSchema };

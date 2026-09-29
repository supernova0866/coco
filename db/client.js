const { createClient } = require('@libsql/client');
const config = require('../config');
const { ITEMS } = require('../economy/currency/items');

const client = createClient({
  url: config.turso.url,
  authToken: config.turso.token,
});

async function ensureColumn(table, column, definition) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const exists = info.rows.some((row) => row.name === column);
  if (!exists) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
    id INTEGER PRIMARY KEY,
    channel_id TEXT,
    contains TEXT,
    action TEXT,
    subaction TEXT,
    import TEXT,
    created_by TEXT,
    created_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope_ids TEXT NOT NULL,
    triggers TEXT NOT NULL,
    message TEXT NOT NULL,
    is_embed INTEGER NOT NULL DEFAULT 0,
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
    purged_at INTEGER,
    revealed_by TEXT,
    revealed_at INTEGER
  )`);

  // Existing deployments already have a confessions table without these columns.
  // CREATE TABLE IF NOT EXISTS above is a no-op for them, so add the columns directly.
  await ensureColumn('confessions', 'revealed_by', 'TEXT');
  await ensureColumn('confessions', 'revealed_at', 'INTEGER');

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
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS economy_users (
    user_id TEXT PRIMARY KEY,
    shards INTEGER NOT NULL DEFAULT 0,
    gems INTEGER NOT NULL DEFAULT 0,
    last_claim_day INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`);

  for (const item of ITEMS) {
    await ensureColumn('economy_users', item.key, 'INTEGER NOT NULL DEFAULT 0');
  }

  await client.execute(`CREATE TABLE IF NOT EXISTS economy_stats (
    user_id TEXT NOT NULL,
    game TEXT NOT NULL,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    wagered INTEGER NOT NULL DEFAULT 0,
    net INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, game)
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS role_payouts (
    role_id TEXT PRIMARY KEY,
    shards INTEGER NOT NULL DEFAULT 0,
    gems INTEGER NOT NULL DEFAULT 0
  )`);

  await client.execute('CREATE INDEX IF NOT EXISTS idx_economy_users_shards ON economy_users (shards DESC)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_economy_users_gems ON economy_users (gems DESC)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_economy_stats_game_net ON economy_stats (game, net DESC)');
}

module.exports = { client, initSchema, ensureColumn };

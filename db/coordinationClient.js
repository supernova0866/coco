const { createClient } = require('@libsql/client');
const config = require('../config');

const client = createClient({
  url: config.tursoCoord.url,
  authToken: config.tursoCoord.token,
});

async function initSchema() {
  await client.execute(`CREATE TABLE IF NOT EXISTS worker_task (
    task_token TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL,
    worker_type TEXT NOT NULL,
    status TEXT NOT NULL,
    pending INTEGER NOT NULL DEFAULT 1,
    failure_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_poll_at INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS worker_payload (
    task_token TEXT PRIMARY KEY,
    script_url TEXT NOT NULL,
    script_commit_sha TEXT,
    extra_code_url TEXT,
    extra_code_commit_sha TEXT,
    data TEXT
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS worker_results (
    task_token TEXT PRIMARY KEY,
    result TEXT NOT NULL,
    completed_at INTEGER NOT NULL
  )`);
}

module.exports = { client, initSchema };

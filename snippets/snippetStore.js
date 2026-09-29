const { client: db } = require('../db/client');

async function insertSnippet({ scopeIds, triggers, message, isEmbed, createdBy }) {
  const result = await db.execute({
    sql: `INSERT INTO snippets (scope_ids, triggers, message, is_embed, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [scopeIds.join(','), triggers.join(','), message, isEmbed ? 1 : 0, createdBy, Date.now()],
  });
  return Number(result.lastInsertRowid);
}

async function updateSnippet(id, { scopeIds, triggers, message, isEmbed }) {
  await db.execute({
    sql: `UPDATE snippets SET scope_ids = ?, triggers = ?, message = ?, is_embed = ? WHERE id = ?`,
    args: [scopeIds.join(','), triggers.join(','), message, isEmbed ? 1 : 0, id],
  });
}

async function deleteSnippet(id) {
  const result = await db.execute({ sql: 'DELETE FROM snippets WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

async function fetchSnippetById(id) {
  const result = await db.execute({ sql: 'SELECT * FROM snippets WHERE id = ?', args: [id] });
  return result.rows[0] || null;
}

async function fetchAllSnippets() {
  const result = await db.execute('SELECT * FROM snippets ORDER BY id');
  return result.rows;
}

async function countSnippets() {
  const result = await db.execute('SELECT COUNT(*) as count FROM snippets');
  return Number(result.rows[0].count);
}

async function fetchSnippetsPage(page, pageSize) {
  const result = await db.execute({
    sql: 'SELECT * FROM snippets ORDER BY id LIMIT ? OFFSET ?',
    args: [pageSize, (page - 1) * pageSize],
  });
  return result.rows;
}

module.exports = {
  insertSnippet,
  updateSnippet,
  deleteSnippet,
  fetchSnippetById,
  fetchAllSnippets,
  countSnippets,
  fetchSnippetsPage,
};

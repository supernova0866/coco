const ITEMS = [];

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;
for (const item of ITEMS) {
  if (!KEY_REGEX.test(item.key)) {
    throw new Error(`Invalid item key "${item.key}" in economy/currency/items.js`);
  }
}

function getOwnedItems(userRow) {
  return ITEMS.map((item) => ({ key: item.key, label: item.label, count: Number(userRow[item.key] ?? 0) })).filter(
    (item) => item.count > 0
  );
}

module.exports = { ITEMS, getOwnedItems };

function splitQuoted(str, delimiter) {
  const tokens = [];
  let current = '';
  let inQuotes = false;

  for (const c of str) {
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === delimiter && !inQuotes) {
      tokens.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  if (current) tokens.push(current.trim());

  return tokens;
}

function splitFirstUnquoted(str, delimiter) {
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === delimiter && !inQuotes) {
      return [str.slice(0, i).trim(), str.slice(i + 1).trim()];
    }
  }
  return [str.trim(), ''];
}

function parseDirective(token) {
  const [type, rest] = splitFirstUnquoted(token, '+');
  return { type, rest };
}

module.exports = { splitQuoted, splitFirstUnquoted, parseDirective };

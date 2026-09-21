const pokemonNames = require('../data/pokemon.json');

const UNKNOWN = '_';
const HINT_REGEX = /^The pok[eé]mon is\s+(.+)$/i;

const MIN_GUESS_REVEALED = 2;
const MAX_GUESS_MATCHES = 3;

if (!Array.isArray(pokemonNames) || pokemonNames.some((n) => typeof n !== 'string')) {
  throw new Error('data/pokemon.json must be a flat array of strings.');
}

function toChars(str) {
  return Array.from(str.normalize('NFC').toLowerCase());
}

const EMOJI_REGEX = /[\p{Extended_Pictographic}\uFE0F\u200D]|<a?:\w+:\d+>/gu;

function cleanText(str) {
  return str.replace(EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();
}

const namesByLength = new Map();
let maxNameWords = 1;
for (const name of new Set(pokemonNames.map(cleanText))) {
  if (!name) continue;
  const chars = toChars(name);
  if (!namesByLength.has(chars.length)) namesByLength.set(chars.length, []);
  namesByLength.get(chars.length).push({ name, chars });
  maxNameWords = Math.max(maxNameWords, name.split(' ').length);
}

const minNameLength = namesByLength.size > 0 ? Math.min(...namesByLength.keys()) : Infinity;

function parseHint(content) {
  if (!content) return null;

  const match = HINT_REGEX.exec(content.trim());
  if (!match) return null;

  let hint = match[1].replace(/\\/g, '').trim();

  if (hint.endsWith('.')) hint = hint.slice(0, -1);

  hint = cleanText(hint);
  return hint.length > 0 ? hint : null;
}

function patternFits(patternChars, nameChars) {
  if (patternChars.length !== nameChars.length) return false;
  for (let i = 0; i < patternChars.length; i++) {
    if (patternChars[i] !== UNKNOWN && patternChars[i] !== nameChars[i]) return false;
  }
  return true;
}

function collect(patternChars, found) {
  const candidates = namesByLength.get(patternChars.length) || [];
  for (const candidate of candidates) {
    if (patternFits(patternChars, candidate.chars)) found.add(candidate.name);
  }
}

function countRevealed(chars) {
  return chars.filter((c) => c !== UNKNOWN && c !== ' ').length;
}

function findMatches(hint) {
  const words = hint.split(' ');

  if (words.length <= maxNameWords) {
    const found = new Set();
    collect(toChars(hint), found);
    if (found.size > 0) return Array.from(found);
  }

  const largestRun = Math.min(words.length - 1, maxNameWords);
  for (let size = largestRun; size >= 1; size--) {
    const found = new Set();

    for (let start = 0; start + size <= words.length; start++) {
      const chars = toChars(words.slice(start, start + size).join(' '));
      if (chars.length < minNameLength) continue;
      if (countRevealed(chars) < MIN_GUESS_REVEALED) continue;
      collect(chars, found);
    }

    if (found.size === 0 || found.size > MAX_GUESS_MATCHES) continue;
    return Array.from(found);
  }

  return [];
}

module.exports = { parseHint, findMatches };

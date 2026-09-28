const GAME = 'coinflip';

const SIDES = new Map([
  ['h', 'heads'],
  ['head', 'heads'],
  ['heads', 'heads'],
  ['t', 'tails'],
  ['tail', 'tails'],
  ['tails', 'tails'],
]);

function parseSide(token) {
  if (!token) return null;
  return SIDES.get(token.toLowerCase()) ?? null;
}

function play(side, bet) {
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  return { result, payout: result === side ? bet * 2 : 0 };
}

module.exports = { GAME, parseSide, play };

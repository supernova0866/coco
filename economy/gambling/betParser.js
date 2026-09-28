const { getMinBet, getMaxBet } = require('./settings');
const { getBalance } = require('../currency/balance');

const BET_REGEX = /^(\d+(?:\.\d+)?)(k)?$/i;

function fmt(n) {
  return n.toLocaleString('en-US');
}

async function parseBet(token, userId) {
  if (!token) return { ok: false, error: 'A bet amount is required.' };

  let bet;
  if (token.toLowerCase() === 'all') {
    const { shards } = await getBalance(userId);
    bet = Math.min(shards, getMaxBet());
  } else {
    const match = BET_REGEX.exec(token);
    if (!match || (match[1].includes('.') && !match[2])) {
      return { ok: false, error: 'Bet must be a whole number, a number ending in k like 2k, or all.' };
    }
    bet = match[2] ? Math.round(Number(match[1]) * 1000) : Number(match[1]);
  }

  if (!Number.isSafeInteger(bet)) {
    return { ok: false, error: 'Bet must be a whole number, a number ending in k like 2k, or all.' };
  }
  if (bet < getMinBet()) return { ok: false, error: `Minimum bet is ${fmt(getMinBet())} Shards.` };
  if (bet > getMaxBet()) return { ok: false, error: `Maximum bet is ${fmt(getMaxBet())} Shards.` };

  return { ok: true, bet };
}

module.exports = { parseBet };

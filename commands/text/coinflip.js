const { UsageError, ValidationError } = require('../../core/errors');
const { parseBet } = require('../../economy/gambling/betParser');
const { beginRound, endRound } = require('../../economy/gambling/cooldowns');
const { settleRound } = require('../../economy/gambling/stats');
const { GAME, parseSide, play } = require('../../economy/gambling/coinflip');
const { debitShards, getBalance } = require('../../economy/currency/balance');

const COOLDOWN_MS = 30 * 1000;
const USAGE = 'coinflip <heads|tails> <bet>';
const EXAMPLE = 'cf heads 500';

function fmt(n) {
  return n.toLocaleString('en-US');
}

module.exports = {
  name: 'coinflip',
  aliases: ['cf'],
  permKey: 'coinflip',

  async execute(message, args) {
    const userId = message.author.id;

    const side = parseSide(args[0]);
    if (!side) throw new UsageError('Pick a side: heads (h) or tails (t).', USAGE, EXAMPLE);

    const parsed = await parseBet(args[1], userId);
    if (!parsed.ok) throw new UsageError(parsed.error, USAGE, EXAMPLE);
    const bet = parsed.bet;

    beginRound(userId, GAME);
    let played = false;
    try {
      const paid = await debitShards(userId, bet);
      if (!paid) {
        const { shards } = await getBalance(userId);
        throw new ValidationError(`You only have ${fmt(shards)} Shards.`);
      }
      played = true;

      const { result, payout } = play(side, bet);
      await settleRound(userId, GAME, bet, payout);

      if (payout > 0) {
        await message.reply(`The coin landed on **${result}**. You won ${fmt(bet)} Shards.`);
      } else {
        await message.reply(`The coin landed on **${result}**. You lost ${fmt(bet)} Shards.`);
      }
    } finally {
      endRound(userId, GAME, played ? COOLDOWN_MS : 0);
    }
  },
};

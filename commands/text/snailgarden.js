const { UsageError, ValidationError } = require('../../core/errors');
const { parseBet } = require('../../economy/gambling/betParser');
const { beginRound, endRound } = require('../../economy/gambling/cooldowns');
const { GAME, parseTiles, startRun } = require('../../economy/gambling/snailgarden');
const { debitShards, creditShards, getBalance } = require('../../economy/currency/balance');

const COOLDOWN_MS = 30 * 1000;
const USAGE = 'snailgarden <bet> [tiles]';
const EXAMPLE = 'sg 1k 10';

module.exports = {
  name: 'snailgarden',
  aliases: ['sg'],
  permKey: 'snailgarden',

  async execute(message, args) {
    const userId = message.author.id;

    const parsedBet = await parseBet(args[0], userId);
    if (!parsedBet.ok) throw new UsageError(parsedBet.error, USAGE, EXAMPLE);

    const parsedTiles = parseTiles(args[1]);
    if (!parsedTiles.ok) throw new UsageError(parsedTiles.error, USAGE, EXAMPLE);

    const bet = parsedBet.bet;
    const tiles = parsedTiles.tiles;

    beginRound(userId, GAME);
    let debited = false;
    let started = false;
    try {
      const paid = await debitShards(userId, bet);
      if (!paid) {
        const { shards } = await getBalance(userId);
        throw new ValidationError(`You only have ${shards.toLocaleString('en-US')} Shards.`);
      }
      debited = true;

      await startRun({ message, bet, tiles, cooldownMs: COOLDOWN_MS });
      started = true;
    } catch (err) {
      if (debited && !started) await creditShards(userId, bet).catch((refundErr) => console.error(refundErr));
      throw err;
    } finally {
      if (!started) endRound(userId, GAME, 0);
    }
  },
};

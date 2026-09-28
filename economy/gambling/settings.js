const { getConfig } = require('../../core/configHelper');

const MIN_BET = 100;
const DEFAULT_MAX_BET = 500000;

let maxBet = DEFAULT_MAX_BET;

async function loadSettings() {
  const raw = await getConfig('max_bet');
  const parsed = Number(raw);
  maxBet = Number.isSafeInteger(parsed) && parsed >= MIN_BET ? parsed : DEFAULT_MAX_BET;
}

function getMinBet() {
  return MIN_BET;
}

function getMaxBet() {
  return maxBet;
}

module.exports = { MIN_BET, DEFAULT_MAX_BET, loadSettings, getMinBet, getMaxBet };

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { settleRound } = require('./stats');
const { creditShards } = require('../currency/balance');
const { endRound } = require('./cooldowns');

const GAME = 'snailgarden';
const EDGE_FACTOR = 0.94;
const MIN_TILES = 4;
const MAX_TILES = 20;
const DEFAULT_TILES = 10;
const IDLE_MS = 2 * 60 * 1000;
const EPSILON = 1e-9;

function fmt(n) {
  return n.toLocaleString('en-US');
}

function failChance(tiles) {
  return 2 / tiles;
}

function multiplier(tiles, cleared) {
  return EDGE_FACTOR * Math.pow(1 / (1 - failChance(tiles)), cleared);
}

function multiplierLabel(tiles, cleared) {
  return cleared === 0 ? '0' : multiplier(tiles, cleared).toFixed(2);
}

function payoutFor(bet, tiles, cleared) {
  if (cleared === 0) return 0;
  return Math.floor(bet * multiplier(tiles, cleared) + EPSILON);
}

function rollTile(tiles) {
  return Math.random() >= failChance(tiles);
}

function parseTiles(token) {
  const error = { ok: false, error: `Tiles must be a whole number from ${MIN_TILES} to ${MAX_TILES}.` };
  if (token === undefined) return { ok: true, tiles: DEFAULT_TILES };
  if (!/^\d+$/.test(token)) return error;
  const tiles = Number(token);
  if (tiles < MIN_TILES || tiles > MAX_TILES) return error;
  return { ok: true, tiles };
}

function headerLine(run) {
  return `Bet: \`${fmt(run.bet)}\`  Tiles: \`${run.tiles}\`  Failure Chance: \`${(failChance(run.tiles) * 100).toFixed(2)}%\``;
}

function buildPanel(run) {
  const cashOut = payoutFor(run.bet, run.tiles, run.cleared);
  const next = payoutFor(run.bet, run.tiles, run.cleared + 1);

  const description = [
    headerLine(run),
    `Cleared: \`${run.cleared}/${run.tiles}\``,
    `Cash Out: \`${fmt(cashOut)}\` \`(${multiplierLabel(run.tiles, run.cleared)}x)\`  Next: \`${fmt(next)}\` \`(${multiplierLabel(run.tiles, run.cleared + 1)}x)\``,
  ].join('\n');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('sg_next').setLabel('Plant Tile').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('sg_cash')
      .setLabel('Cash Out')
      .setStyle(ButtonStyle.Success)
      .setDisabled(run.cleared < 1)
  );

  return {
    embeds: [new EmbedBuilder().setTitle('Snailgarden').setDescription(description)],
    components: [row],
  };
}

function buildResult(run, outcome, payout) {
  let result;
  if (outcome === 'fail') {
    result = `Failed on tile ${run.cleared + 1}. You lost ${fmt(run.bet)} Shards.`;
  } else if (outcome === 'forfeit') {
    result = `Timed out. You forfeited ${fmt(run.bet)} Shards.`;
  } else {
    const opener = outcome === 'complete' ? `Cleared all ${run.tiles} tiles.` : `Cashed out after ${run.cleared} tile${run.cleared === 1 ? '' : 's'}.`;
    result = `${opener} Payout: ${fmt(payout)} Shards (${multiplierLabel(run.tiles, run.cleared)}x).`;
  }

  return {
    embeds: [new EmbedBuilder().setTitle('Snailgarden').setDescription(`${headerLine(run)}\n\n${result}`)],
    components: [],
  };
}

async function startRun({ message, bet, tiles, cooldownMs }) {
  const userId = message.author.id;
  const run = { bet, tiles, cleared: 0, done: false };

  const panel = await message.reply({ ...buildPanel(run), allowedMentions: { repliedUser: false } });

  const collector = panel.createMessageComponentCollector({
    idle: IDLE_MS,
    filter: (interaction) => {
      if (interaction.user.id === userId) return true;
      interaction.reply({ content: 'This is not your panel.', ephemeral: true }).catch(() => {});
      return false;
    },
  });

  async function conclude(interaction, outcome) {
    run.done = true;
    const payout = outcome === 'fail' ? 0 : payoutFor(run.bet, run.tiles, run.cleared);
    await settleRound(userId, GAME, run.bet, payout);
    await interaction.editReply(buildResult(run, outcome, payout));
    collector.stop('done');
  }

  collector.on('collect', async (interaction) => {
    try {
      await interaction.deferUpdate();
      if (run.done) return;

      if (interaction.customId === 'sg_cash') {
        if (run.cleared < 1) return;
        await conclude(interaction, 'cashout');
        return;
      }

      if (interaction.customId !== 'sg_next') return;

      if (!rollTile(run.tiles)) {
        await conclude(interaction, 'fail');
        return;
      }

      run.cleared++;
      if (run.cleared >= run.tiles) {
        await conclude(interaction, 'complete');
        return;
      }

      await interaction.editReply(buildPanel(run));
    } catch (err) {
      console.error(err);
      await interaction.followUp({ content: 'Something went wrong running that.', ephemeral: true }).catch(() => {});
      await panel.edit({ components: [] }).catch(() => {});
      collector.stop('error');
    }
  });

  collector.on('end', async (collected, reason) => {
    try {
      if (!run.done) {
        run.done = true;
        if (reason === 'idle') {
          await settleRound(userId, GAME, run.bet, 0);
          await panel.edit(buildResult(run, 'forfeit', 0)).catch(() => {});
        } else {
          await creditShards(userId, run.bet);
          await panel.edit({ components: [] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      endRound(userId, GAME, reason === 'idle' || reason === 'done' ? cooldownMs : 0);
    }
  });
}

module.exports = { GAME, multiplier, payoutFor, parseTiles, startRun };

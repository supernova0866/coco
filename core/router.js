const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getPrefixes } = require('./configHelper');
const { resolveCommand } = require('./aliasResolver');
const { checkPermission } = require('./permissions');
const { resolveTarget } = require('./targetResolver');
const { parseDuration } = require('./durationParser');
const { setStatus } = require('./reactionStatus');
const { runBanFlow } = require('./banFlow');
const { PermissionError, ValidationError, NoTargetError } = require('./errors');
const { randomTitle } = require('./powerFlexTitles');

const { muteUser } = require('../moderation/muteUser');
const { unbanUser } = require('../moderation/unbanUser');
const { unmuteUser } = require('../moderation/unmuteUser');
const { kickUser } = require('../moderation/kickUser');

const NATIVE_PERMS = {
  ban: PermissionFlagsBits.BanMembers,
  unban: PermissionFlagsBits.BanMembers,
  mute: PermissionFlagsBits.ModerateMembers,
  unmute: PermissionFlagsBits.ModerateMembers,
  kick: PermissionFlagsBits.KickMembers,
};

const FLEX_COMMANDS = ['ban', 'mute', 'kick'];
const USAGE = {
  ban: '[user] [reason]',
  mute: '[user] [duration] [reason]',
  kick: '[user] [reason]',
};
const ACTION_WORDS = {
  ban: { base: 'ban', past: 'banned' },
  mute: { base: 'mute', past: 'muted' },
  kick: { base: 'kick', past: 'kicked' },
};

function isOwner(userId) {
  return userId === config.ownerId;
}

function findTextCommand(client, tokens) {
  const maxWords = Math.min(3, tokens.length);
  for (let len = maxWords; len >= 1; len--) {
    const name = tokens.slice(0, len).join(' ').toLowerCase();
    if (client.textCommands.has(name)) {
      return { command: client.textCommands.get(name), consumed: len };
    }
  }
  return null;
}

async function runNativeCommand(message, client, commandName, args, prefix) {
  await setStatus(message, 'loading');

  try {
    if (!isOwner(message.author.id) && !message.member.permissions.has(NATIVE_PERMS[commandName])) {
      throw new PermissionError('Insufficient Permissions.');
    }

    if (commandName === 'ban') {
      const { targetId, reason } = await resolveTarget(message, args);
      await runBanFlow({
        channel: message.channel,
        guild: message.guild,
        targetId,
        reason: reason || 'No reason provided.',
        invokerId: message.author.id,
        statusMessage: message,
      });
      return;
    }

    if (commandName === 'mute') {
      const { targetId, reason: firstPass } = await resolveTarget(message, args);
      const remaining = firstPass.split(/\s+/);
      const durationToken = remaining[0];
      const durationSeconds = parseDuration(durationToken);
      if (!durationSeconds) {
        throw new ValidationError('Duration is required, format like 2d, 6h, 30m.');
      }
      const reason = remaining.slice(1).join(' ') || 'No reason provided.';
      const id = await muteUser(message.guild, targetId, reason, durationSeconds, message.author.id);
      await message.reply(`Muted <@${targetId}> (${id}) for ${durationToken}.`);
      await setStatus(message, 'success');
      return;
    }

    if (commandName === 'unban') {
      const { targetId, reason } = await resolveTarget(message, args);
      await unbanUser(message.guild, targetId, reason || 'No reason provided.', message.author.id);
      await message.reply(`Unbanned <@${targetId}>.`);
      await setStatus(message, 'success');
      return;
    }

    if (commandName === 'unmute') {
      const { targetId, reason } = await resolveTarget(message, args);
      await unmuteUser(message.guild, targetId, reason || 'No reason provided.', message.author.id);
      await message.reply(`Unmuted <@${targetId}>.`);
      await setStatus(message, 'success');
      return;
    }

    if (commandName === 'kick') {
      const { targetId, reason } = await resolveTarget(message, args);
      await kickUser(message.guild, targetId, reason || 'No reason provided.');
      await message.reply(`Kicked <@${targetId}>.`);
      await setStatus(message, 'success');
      return;
    }
  } catch (err) {
    if (err instanceof NoTargetError && FLEX_COMMANDS.includes(commandName)) {
      await setStatus(message, 'failure');
      const embed = new EmbedBuilder()
        .setTitle(randomTitle(ACTION_WORDS[commandName]))
        .addFields({ name: 'Usage', value: `> \`${prefix}${commandName} ${USAGE[commandName]}\`` });
      await message.reply({ embeds: [embed] });
    } else if (err instanceof PermissionError || err instanceof ValidationError) {
      await setStatus(message, 'failure');
      await message.reply(err.message);
    } else {
      await setStatus(message, 'error');
      await message.reply('Something went wrong running that.');
      console.error(err);
    }
  }
}

async function runTextCommand(message, command, args) {
  await setStatus(message, 'loading');

  try {
    if (!isOwner(message.author.id)) {
      const permResult = await checkPermission('text_perms', command.permKey, message.member, message.channel.id);
      if (!permResult.allowed) {
        throw new PermissionError(permResult.reason);
      }
    }

    await command.execute(message, args);
    await setStatus(message, 'success');
  } catch (err) {
    if (err instanceof PermissionError || err instanceof ValidationError) {
      await setStatus(message, 'failure');
      await message.reply(err.message);
    } else {
      await setStatus(message, 'error');
      await message.reply('Something went wrong running that.');
      console.error(err);
    }
  }
}

async function handleMessage(message, client) {
  if (message.author.bot) return;

  const prefixes = await getPrefixes();
  const matchedPrefix = prefixes.find((p) => message.content.startsWith(p));
  if (!matchedPrefix) return;

  const rest = message.content.slice(matchedPrefix.length).trim();
  if (!rest) return;

  const tokens = rest.split(/\s+/);
  const firstToken = tokens[0];

  const resolved = await resolveCommand(firstToken);
  if (resolved) {
    await runNativeCommand(message, client, resolved.command, tokens.slice(1), matchedPrefix);
    return;
  }

  const textMatch = findTextCommand(client, tokens);
  if (textMatch) {
    await runTextCommand(message, textMatch.command, tokens.slice(textMatch.consumed));
  }
}

module.exports = { handleMessage };

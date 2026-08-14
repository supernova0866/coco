const { REST, Routes } = require('discord.js');
const config = require('../config');

function pickComparableFields(cmd) {
  return {
    name: cmd.name,
    description: cmd.description,
    options: cmd.options || [],
    default_member_permissions: cmd.default_member_permissions ?? null,
    dm_permission: cmd.dm_permission ?? true,
    type: cmd.type ?? 1,
  };
}

function stableStringify(obj) {
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  if (obj && typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(obj);
}

function commandsMatch(local, remote) {
  return stableStringify(pickComparableFields(local)) === stableStringify(pickComparableFields(remote));
}

async function deployMissingCommands(client) {
  const rest = new REST().setToken(config.discordToken);
  const existing = await rest.get(Routes.applicationCommands(config.clientId));
  const existingByName = new Map(existing.map((c) => [c.name, c]));

  for (const command of client.slashCommands.values()) {
    const localJson = command.data.toJSON();
    const remote = existingByName.get(localJson.name);

    if (!remote) {
      await rest.post(Routes.applicationCommands(config.clientId), { body: localJson });
      console.log(`Deployed new command: ${localJson.name}`);
      continue;
    }

    if (!commandsMatch(localJson, remote)) {
      await rest.patch(Routes.applicationCommand(config.clientId, remote.id), { body: localJson });
      console.log(`Updated command: ${localJson.name}`);
    }
  }
}

module.exports = { deployMissingCommands };

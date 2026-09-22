const { REST, Routes } = require('discord.js');
const config = require('../config');

async function deployMissingCommands(client) {
  const rest = new REST().setToken(config.discordToken);

  const existingGlobal = await rest.get(Routes.applicationCommands(config.clientId));
  if (existingGlobal.length > 0) {
    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    console.log(`Removed ${existingGlobal.length} leftover global command(s).`);
  }

  const localCommands = Array.from(client.slashCommands.values()).map((c) => c.data.toJSON());
 
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: localCommands });

  console.log(`Deployed ${localCommands.length} command(s) to guild ${config.guildId}.`);
}

module.exports = { deployMissingCommands };

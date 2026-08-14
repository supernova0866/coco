const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config');
const mainDb = require('./db/client');
const coordDb = require('./db/coordinationClient');
const { loadResponders } = require('./autoresponders/autoresponder');
const { deployMissingCommands } = require('./core/commandDeploy');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.slashCommands = new Collection();
client.textCommands = new Collection();

function loadSlashCommands() {
  const dir = path.join(__dirname, 'commands/slash');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const command = require(path.join(dir, file));
    if (command?.data?.name) {
      client.slashCommands.set(command.data.name, command);
    }
  }
}

function loadTextCommands() {
  const dir = path.join(__dirname, 'commands/text');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const command = require(path.join(dir, file));
    if (command?.name) {
      client.textCommands.set(command.name, command);
    }
  }
}

function loadEvents() {
  const dir = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const event = require(path.join(dir, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

(async () => {
  await mainDb.initSchema();
  if (config.tursoCoord.url) {
    await coordDb.initSchema();
  }

  loadSlashCommands();
  loadTextCommands();
  loadEvents();
  loadResponders();

  await deployMissingCommands(client);

  await client.login(config.discordToken);
})();

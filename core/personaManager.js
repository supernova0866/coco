const { client: db } = require('../db/client');
const { getConfig } = require('./configHelper');
const personaMap = require('../personas/personaMap');

const COOLDOWN_MS = 30 * 60 * 1000;
let lastSwitchAt = 0;

function getPersonaByName(name) {
  return personaMap[name] || null;
}

function listPersonaNames() {
  return Object.keys(personaMap);
}

async function getActivePersonaName() {
  return getConfig('active_persona');
}

function getRemainingCooldownMs() {
  const elapsed = Date.now() - lastSwitchAt;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

async function applyPersona(client, guild, name, persona) {
  if (persona.nickname) {
    await guild.members.me.setNickname(persona.nickname).catch(() => {});
  }
  if (persona.avatarUrl) {
    await client.user.setAvatar(persona.avatarUrl).catch(() => {});
  }
  if (persona.bannerUrl) {
    await client.user.setBanner(persona.bannerUrl).catch(() => {});
  }

  await db.execute({
    sql: `INSERT INTO config (config_name, value) VALUES ('active_persona', ?)
          ON CONFLICT(config_name) DO UPDATE SET value = excluded.value`,
    args: [name],
  });

  lastSwitchAt = Date.now();
}

module.exports = {
  getPersonaByName,
  listPersonaNames,
  getActivePersonaName,
  getRemainingCooldownMs,
  applyPersona,
};

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const { client: db } = require('../../db/client');

const CONFIG_SCHEMA = {
  confession_channel_id: { label: 'Confession Channel', type: 'channel' },
  booster_role_id: { label: 'Booster Role', type: 'role' },
  booster_role_position_reference_id: { label: 'Booster Role Position Reference', type: 'role' },
  prefixes: { label: 'Prefixes', type: 'list' },
};

function displayValue(key, raw) {
  if (!raw) return 'Not set';
  const type = CONFIG_SCHEMA[key].type;
  if (type === 'channel') return `<#${raw}>`;
  if (type === 'role') return `<@&${raw}>`;
  if (type === 'list') return JSON.parse(raw).join(', ');
  return raw;
}

async function fetchAllConfig() {
  const result = await db.execute('SELECT config_name, value FROM config');
  const map = {};
  for (const row of result.rows) map[row.config_name] = row.value;
  return map;
}

function buildContainer(values) {
  const container = new ContainerBuilder();
  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    const button = new ButtonBuilder()
      .setCustomId(`config_edit_${key}`)
      .setLabel('Edit')
      .setStyle(ButtonStyle.Secondary);

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${schema.label}**\n${displayValue(key, values[key])}`)
      )
      .setButtonAccessory(button);

    container.addSectionComponents(section);
  }
  return container;
}

function buildModal(key, currentRaw) {
  const schema = CONFIG_SCHEMA[key];
  const input = new TextInputBuilder()
    .setCustomId('value')
    .setLabel(`${schema.label} ID${schema.type === 'list' ? 's (comma separated)' : ''}`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  if (currentRaw) {
    input.setValue(schema.type === 'list' ? JSON.parse(currentRaw).join(',') : currentRaw);
  }

  return new ModalBuilder()
    .setCustomId(`config_modal_${key}`)
    .setTitle(`Edit ${schema.label}`)
    .addComponents(new ActionRowBuilder().addComponents(input));
}

async function validateAndFormat(guild, key, rawInput) {
  const schema = CONFIG_SCHEMA[key];

  if (schema.type === 'channel') {
    const channel = await guild.channels.fetch(rawInput).catch(() => null);
    if (!channel) return { ok: false, error: 'That channel ID could not be found in this server.' };
    return { ok: true, value: rawInput };
  }

  if (schema.type === 'role') {
    const role = await guild.roles.fetch(rawInput).catch(() => null);
    if (!role) return { ok: false, error: 'That role ID could not be found in this server.' };
    return { ok: true, value: rawInput };
  }

  if (schema.type === 'list') {
    const list = rawInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return { ok: false, error: 'Provide at least one value.' };
    return { ok: true, value: JSON.stringify(list) };
  }

  return { ok: true, value: rawInput };
}

module.exports = {
  name: 'config',
  permKey: 'config',

  async execute(message) {
    const values = await fetchAllConfig();
    const panel = await message.channel.send({
      components: [buildContainer(values)],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = panel.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({ content: 'This is not your panel.', ephemeral: true });
        return;
      }

      const key = interaction.customId.replace('config_edit_', '');
      const currentValues = await fetchAllConfig();

      await interaction.showModal(buildModal(key, currentValues[key]));

      const modalSubmit = await interaction
        .awaitModalSubmit({
          filter: (i) => i.customId === `config_modal_${key}` && i.user.id === message.author.id,
          time: 2 * 60 * 1000,
        })
        .catch(() => null);
      if (!modalSubmit) return;

      const rawInput = modalSubmit.fields.getTextInputValue('value');
      const result = await validateAndFormat(message.guild, key, rawInput);

      if (!result.ok) {
        await modalSubmit.reply({ content: result.error, ephemeral: true });
        return;
      }

      await db.execute({
        sql: `INSERT INTO config (config_name, value) VALUES (?, ?)
              ON CONFLICT(config_name) DO UPDATE SET value = excluded.value`,
        args: [key, result.value],
      });

      const updatedValues = await fetchAllConfig();
      await panel.edit({ components: [buildContainer(updatedValues)], flags: MessageFlags.IsComponentsV2 });
      await modalSubmit.reply({ content: `${CONFIG_SCHEMA[key].label} updated.`, ephemeral: true });
    });
  },
};

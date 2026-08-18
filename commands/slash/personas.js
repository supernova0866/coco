const { SlashCommandBuilder } = require('discord.js');
const { requireSlashPermission } = require('../../core/slashGuard');
const { ValidationError } = require('../../core/errors');
const {
  getPersonaByName,
  listPersonaNames,
  getActivePersonaName,
  getRemainingCooldownMs,
  applyPersona,
} = require('../../core/personaManager');
const { logEvent } = require('../../core/webhookLogger');

module.exports = {
  permKeys: ['personas_switch', 'personas_view'],
  data: new SlashCommandBuilder()
    .setName('personas')
    .setDescription('Bot persona commands')
    .addSubcommand((sub) =>
      sub
        .setName('switch')
        .setDescription('Switch to a different persona')
        .addStringOption((o) => o.setName('name').setDescription('Persona name').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('View the active persona')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'switch') {
      await requireSlashPermission(interaction, 'personas_switch');

      const name = interaction.options.getString('name');
      const persona = getPersonaByName(name);
      if (!persona) {
        throw new ValidationError(`No persona named "${name}". Available: ${listPersonaNames().join(', ') || 'none'}.`);
      }

      const remainingMs = getRemainingCooldownMs();
      if (remainingMs > 0) {
        const minutes = Math.ceil(remainingMs / 60000);
        throw new ValidationError(
          `Persona switching is rate limited. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
        );
      }

      await applyPersona(interaction.client, interaction.guild, name, persona);
      await interaction.reply(`Switched to persona "${name}".`);
      await logEvent(`Persona switched to "${name}" by <@${interaction.user.id}>.`);
      return;
    }

    if (sub === 'view') {
      await requireSlashPermission(interaction, 'personas_view');

      const activeName = await getActivePersonaName();
      if (!activeName) {
        await interaction.reply('No persona is currently active.');
        return;
      }

      const persona = getPersonaByName(activeName);
      await interaction.reply(
        `Active persona: **${activeName}**\n` +
          `Nickname: ${persona?.nickname || 'Not set'}\n` +
          `Avatar: ${persona?.avatarUrl || 'Not set'}\n` +
          `Banner: ${persona?.bannerUrl || 'Not set'}`
      );
    }
  },
};

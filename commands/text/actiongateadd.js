const { MessageFlags } = require('discord.js');
const { client: db } = require('../../db/client');
const { buildGatePanelContainer, attachPanelCollector } = require('../../actiongates/panel');

module.exports = {
  name: 'action gate add',
  permKey: 'action_gate_add',

  async execute(message) {
    const result = await db.execute({
      sql: 'INSERT INTO action_gates (channel_id, contains, action, subaction, import, created_by, created_at) VALUES (NULL, NULL, NULL, NULL, NULL, ?, ?)',
      args: [message.author.id, Date.now()],
    });
    const id = Number(result.lastInsertRowid);
    const gate = { id, channel_id: null, contains: null, action: null, subaction: null };

    const panel = await message.channel.send({
      components: [buildGatePanelContainer(gate)],
      flags: MessageFlags.IsComponentsV2,
    });

    attachPanelCollector(panel, message.author.id, id, message.guild);
  },
};

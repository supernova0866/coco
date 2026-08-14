const { startScheduler } = require('../scheduler/scheduler');
const { startStatusRotator } = require('../core/statusRotator');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    startScheduler(client);
    startStatusRotator(client);
  },
};

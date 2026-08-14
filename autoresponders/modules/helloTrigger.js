module.exports = {
  name: 'hello_trigger',
  match: { type: 'contains', value: 'good bot' },
  channels: null,
  actions: ['react+👋', 'reply+Hello there!'],
};

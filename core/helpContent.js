const slashSections = [
  {
    category: 'Moderation',
    commands: [
      { usage: '/ban <user> <reason>', description: 'Ban a user, with a delete-message range prompt.' },
      { usage: '/mute <user> <reason> <duration>', description: 'Timeout a user.' },
      { usage: '/unban <user> <reason>', description: 'Unban a user.' },
      { usage: '/unmute <user> <reason>', description: 'Remove a timeout.' },
      { usage: '/kick <user> <reason>', description: 'Kick a user.' },
      { usage: '/warn <user> <reason> <duration>', description: 'Warn a user.' },
      { usage: '/mod view <warn|timeout|ban> <user>', description: 'View active moderation history for a user.' },
    ],
  },
  {
    category: 'Economy',
    commands: [
      { usage: '/collect', description: 'Collect your role payout. Resets at 00:00 GMT.' },
      { usage: '/balance (user)', description: 'View Shards and Gems.' },
      { usage: '/leaderboard (type)', description: 'View the top players by Shards, Gems or game winnings.' },
    ],
  },
  {
    category: 'Confessions',
    commands: [{ usage: '/confess <confession>', description: 'Send an anonymous numbered confession.' }],
  },
  {
    category: 'Booster Roles',
    commands: [
      { usage: '/boostroles create <name> <hex>', description: 'Create your booster role.' },
      { usage: '/boostroles edit <name> <hex>', description: 'Edit your booster role.' },
      { usage: '/boostroles share <add|remove> <users>', description: 'Share or unshare your booster role.' },
      { usage: '/boostroles view (user)', description: 'View a booster role.' },
      { usage: '/boostroles delete', description: 'Delete your booster role.' },
    ],
  },
  {
    category: 'Snippets',
    commands: [
      { usage: '/snippets add', description: 'Add a new auto-reply snippet (exact-match trigger).' },
      { usage: '/snippets view (id)', description: 'Browse snippets, or view and edit one in detail.' },
      { usage: '/snippets remove <id>', description: 'Remove a snippet.' },
    ],
  },
  {
    category: 'Persona & Presence',
    commands: [
      { usage: '/personas switch <name>', description: 'Switch the bot persona.' },
      { usage: '/personas view', description: 'View the active persona.' },
      { usage: '/indicator set <online|idle|dnd>', description: 'Set the bot presence indicator.' },
      { usage: '/status list', description: 'List rotating statuses.' },
      { usage: '/status add <text> <type>', description: 'Add a rotating status.' },
      { usage: '/status remove <id>', description: 'Remove a rotating status.' },
      { usage: '/status edit <id> <position>', description: "Change a status's rotation position." },
    ],
  },
  {
    category: 'Help',
    commands: [{ usage: '/help', description: 'Show this list.' }],
  },
];

const textSections = [
  {
    category: 'Moderation',
    commands: [
      { usage: 'ban <user> <reason>  (alias: getout)', description: 'Ban a user, with a delete-message range prompt.' },
      { usage: 'mute <user> <duration> <reason>  (alias: stfu)', description: 'Timeout a user.' },
      { usage: 'unban <user> <reason>', description: 'Unban a user.' },
      { usage: 'unmute <user> <reason>', description: 'Remove a timeout.' },
      { usage: 'kick <user> <reason>', description: 'Kick a user.' },
      { usage: 'warn <user> <duration> <reason>', description: 'Warn a user.' },
    ],
  },
  {
    category: 'Gambling',
    commands: [
      {
        usage: 'coinflip <heads|tails> <bet>  (alias: cf)',
        description: 'Flip a coin. Win double your bet or lose it. Bet accepts numbers, 2k style, or all.',
      },
      {
        usage: 'snailgarden <bet> (tiles)  (alias: sg)',
        description: 'Plant tiles for a growing payout. 4 to 20 tiles, default 10. Cash out any time after the first tile.',
      },
    ],
  },
  {
    category: 'Server Config',
    commands: [{ usage: 'config', description: 'Open the server config panel.' }],
  },
  {
    category: 'Confessions',
    commands: [
      { usage: 'confession reveal <id>', description: 'Reveal who sent a confession, if not yet anonymized.' },
      { usage: 'confession purge <id> <reason>', description: "Overwrite a confession's content within 5 days." },
    ],
  },
  {
    category: 'Action Gates',
    commands: [
      { usage: 'action gate add', description: 'Create a new action gate.' },
      { usage: 'action gate view', description: 'Browse and edit existing action gates.' },
      { usage: 'action gate remove <id>', description: 'Delete an action gate.' },
    ],
  },
  {
    category: 'Help',
    commands: [{ usage: 'help', description: 'Show this list.' }],
  },
];

module.exports = { slashSections, textSections };

const TITLES = [
  'Cool, you can {action} people. We know.',
  'Big {action} energy, no target though',
  "With great power... well, comes no responsibility. Sometimes",
  'Flex acknowledged',
  "That's not how this works",
  "We get it, you've got perms",
  'Wow. Terrifying. Now add a user.',
  'Nobody was {actionPast}. Nobody was scared.',
  "You really said '{action}' and then... nothing.",
  'The {action} button is right there. Use it.',
  "That's a lot of confidence to {action} nobody.",
  'This is a drill. Nobody got {actionPast} today.',
  'You brought the {action}, not the target.',
  'Almost had someone {actionPast} there.',
  "One of these days you'll actually {action} someone.",
  'Big {action} hammer, no nail in sight.',
  'Access granted. Target: unknown.',
  'Loading target... target not found.',
  'The power was real. The user was not.',
  'Show of force, minus the force part.',
  "You've got the badge, not the perp.",
  'Great setup. No punchline.',
  'So close to being scary.',
  'Permissions: yes. Aim: no.',
  '{action} energy detected. Target energy: zero.',
  'You typed like a mod. You aimed like nobody.',
  'Ready to {action}. Missing: who.',
  'The {action} was strong. The user was imaginary.',
  'Command loaded. Victim not included.',
  'Somewhere, a rule breaker just got lucky.',
];

let lastIndex = null;

function randomTitle(actionWords) {
  let index;
  do {
    index = Math.floor(Math.random() * TITLES.length);
  } while (TITLES.length > 1 && index === lastIndex);
  lastIndex = index;

  const template = TITLES[index];
  return template.replace('{action}', actionWords.base).replace('{actionPast}', actionWords.past);
}

module.exports = { randomTitle };

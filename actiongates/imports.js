const { runActionList } = require('./actions');

function parseImportDirective(str) {
  const match = /^(\w+)\((.+)\)$/.exec(str.trim());
  if (!match) return null;
  return { cls: match[1], ref: match[2] };
}

const IMPORTS = {
  auto: async (msg, filename) => {
    const { getResponderByName } = require('../autoresponders/autoresponder');
    const responder = getResponderByName(filename);
    if (responder) await runActionList(msg, responder.actions);
  },
};

async function runImport(msg, importField) {
  const parsed = parseImportDirective(importField);
  if (!parsed) return;
  const handler = IMPORTS[parsed.cls];
  if (handler) await handler(msg, parsed.ref);
}

module.exports = { IMPORTS, runImport };

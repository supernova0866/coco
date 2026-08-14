const CONTAINS_CHECKS = {
  attachment: (msg) => msg.attachments.size > 0,
  link: (msg) => /https?:\/\//i.test(msg.content),
  text: (msg) => msg.content.trim().length > 0,
};

function evaluateContains(msg, containsField) {
  return containsField
    .split(',')
    .map((s) => s.trim())
    .every((cond) => {
      const negate = cond.startsWith('!');
      const type = negate ? cond.slice(1) : cond;
      const check = CONTAINS_CHECKS[type];
      if (!check) return false;
      const result = check(msg);
      return negate ? !result : result;
    });
}

module.exports = { CONTAINS_CHECKS, evaluateContains };

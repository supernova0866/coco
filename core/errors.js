class PermissionError extends Error {}
class ValidationError extends Error {}
class NoTargetError extends ValidationError {}

class UsageError extends ValidationError {
  constructor(message, usage, example = null) {
    super(message);
    this.usage = usage;
    this.example = example;
  }
}

module.exports = { PermissionError, ValidationError, NoTargetError, UsageError };

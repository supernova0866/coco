class PermissionError extends Error {}
class ValidationError extends Error {}
class NoTargetError extends ValidationError {}

module.exports = { PermissionError, ValidationError, NoTargetError };

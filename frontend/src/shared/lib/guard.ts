export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function assertDefined<T>(value: T | null | undefined, message = "Value is not defined"): T {
  if (!isDefined(value)) throw new Error(message);
  return value;
}

export function assertNonEmptyString(value: unknown, message = "Expected non-empty string"): string {
  if (!isNonEmptyString(value)) throw new Error(message);
  return value;
}
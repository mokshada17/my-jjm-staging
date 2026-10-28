export const validators = {
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  required: (value: unknown) => value !== null && value !== undefined && value !== "",
  minLength: (min: number) => (value: string) => value.length >= min,
  maxLength: (max: number) => (value: string) => value.length <= max,
  pattern: (regex: RegExp) => (value: string) => regex.test(value),
  numeric: (value: string) => /^\d+$/.test(value),
  url: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
};
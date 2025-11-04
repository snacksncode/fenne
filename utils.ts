export function ensure<T>(value: T | null | undefined, message?: string): T {
  if (value == null) {
    throw new Error(message || 'Value is nullish');
  }
  return value;
}

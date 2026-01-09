export function ensure<T>(value: T | null | undefined, message?: string): T {
  if (value == null) {
    throw new Error(message || 'Value is nullish');
  }
  return value;
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

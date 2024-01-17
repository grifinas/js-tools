export function toKebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase letters
    .toLowerCase();
}
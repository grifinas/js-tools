export function toKebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase letters
    .toLowerCase();
}

function toThisKebabCase(this: string): string {
  return toKebabCase(this);
}


interface String {
  toKebabCase: typeof toThisKebabCase;
}

Object.defineProperty(String.prototype, "toKebabCase", toThisKebabCase);

export {};

declare global {
  interface String {
    canonical(replaceWith?: string): string;
    substringFrom(needle: string): string;
    toKebabCase(): string;
  }
}

export function toKebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Insert hyphen between lowercase and uppercase letters
    .toLowerCase();
}
Object.defineProperty(String.prototype, "canonical", {
  value: function (this: string, replaceWith: string = "_") {
    return this.replace(/[^\w]+/g, replaceWith);
  },
  writable: false,
  configurable: false,
});
Object.defineProperty(String.prototype, "substringFrom", {
  value: function (this: string, needle: string) {
    const index = this.indexOf(needle);
    if (index === -1) return "";
    return this.substring(index);
  },
  writable: false,
  configurable: false,
});
Object.defineProperty(String.prototype, "toKebabCase", {
  value: function (this: string) {
    return toKebabCase(this);
  },
  writable: false,
  configurable: false,
});

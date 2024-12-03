export function substringFrom(this: string, needle: string): string {
  const index = this.indexOf(needle);
  if (index === -1) return "";
  return this.substring(index);
}

interface String {
  substringFrom: typeof substringFrom;
}

Object.defineProperty(String.prototype, "substringFrom", substringFrom);

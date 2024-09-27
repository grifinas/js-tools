export type Token =
  | { type: "WORD"; value: string }
  | { type: "BRACKET"; value: string }
  | { type: "BRACE"; value: string }
  | { type: "PAREN"; value: string }
  | { type: "DOT"; value: string }
  | { type: "NUMBER"; value: string }
  | { type: "EQUALS"; value: string }
  | { type: "SEMICOLON"; value: string };

function isWord(char: string): boolean {
  return /[a-zA-Z\-]/.test(char);
}

function isNumber(char: string): boolean {
  return /[0-9]/.test(char);
}

export function tokenize(input: string): TokenStream {
  const tokens: Token[] = [];
  let current = 0;

  while (current < input.length) {
    let char = input[current];

    if (isWord(char)) {
      let value = "";
      while (current < input.length && isWord(input[current])) {
        value += input[current];
        current++;
      }
      tokens.push({ type: "WORD", value });
      continue;
    }

    if (isNumber(char)) {
      let value = "";
      while (current < input.length && isNumber(input[current])) {
        value += input[current];
        current++;
      }
      tokens.push({ type: "NUMBER", value });
      continue;
    }

    if (char === "[" || char === "]") {
      tokens.push({ type: "BRACKET", value: char });
      current++;
      continue;
    }

    if (char === "{" || char === "}") {
      tokens.push({ type: "BRACE", value: char });
      current++;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "PAREN", value: char });
      current++;
      continue;
    }

    if (char === ".") {
      tokens.push({ type: "DOT", value: char });
      current++;
      continue;
    }

    if (char === ";") {
      tokens.push({ type: "SEMICOLON", value: char });
      current++;
      continue;
    }

    if (char === "=") {
      tokens.push({ type: "EQUALS", value: char });
      current++;
      continue;
    }

    //Comment
    if (char === "#") {
      let comment = "";
      while (current < input.length && input[current] !== "\n") {
        comment += input[current];
        current++;
      }
      continue;
    }

    // Skip any whitespace
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    console.log(
      "Unexpected char near:",
      input.substring(current - 10, current + 10),
    );
    throw new TypeError("Unexpected character: " + char);
  }

  return new TokenStream(tokens);
}

export class TokenStream {
  private index: number = 0;

  constructor(private readonly tokens: Token[]) {
    // console.log("tokens", tokens);
  }

  get(): Token {
    const token = this.tokens[this.index];
    if (!token) {
      throw new Error(
        `No token at index: ${this.index}, there are ${this.tokens.length} tokens`,
      );
    }
    return token;
  }

  getIndexed(i: number) {
    const token = this.tokens[i];
    if (!token) {
      throw new Error(
        `No token at index: ${i}, there are ${this.tokens.length} tokens`,
      );
    }
    return token;
  }

  next(): Token {
    this.index++;
    return this.get();
  }

  prev(): Token {
    this.index--;
    return this.get();
  }

  hasNext(): boolean {
    return this.tokens.length > this.index + 1;
  }

  peek(offset: number = 1): Token {
    return this.getIndexed(this.index + offset);
  }

  multiPeek(offset: number = 1): Token[] {
    const results = [];
    for (let i = 0; i < offset; i++) {
      results.push(this.getIndexed(this.index + i));
    }
    return results;
  }
}

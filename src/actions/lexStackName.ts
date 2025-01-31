import { tokenAssert, TokenStream, unexpectedToken } from "./tokenize";

export function lexStackName(tokens: TokenStream): string[] {
  console.log("lexing", tokens.toString());
  let parts: string[] = [];

  do {
    const token = tokens.get();
    switch (token.type) {
      case "WORD":
        parts = mult(parts, [token.value]);
        break;
      case "SPECIAL":
        tokenAssert(token, "SPECIAL", "@");
        parts = mult(parts, ["[[STAGE]]"]);
        break;
      case "BRACKET":
        tokenAssert(token, "BRACKET", "[");
        const words = getWords(tokens);
        parts = mult(parts, words);
        break;
      default:
        unexpectedToken(token, "Stack name");
    }
  } while (tokens.hasNext() && tokens.next());

  return parts;
}

function getWords(tokens: TokenStream): string[] {
  const words: string[] = [];
  while (true) {
    const token = tokens.next();
    tokenAssert(token, "WORD");
    words.push(token.value);
    const next = tokens.next();
    if (next.type === "COMMA") continue;
    tokenAssert(next, "BRACKET", "]");
    return words;
  }
}

function mult(a: string[], b: string[]): string[] {
  const res: string[] = [];
  if (a.length) {
    a.forEach((part) => {
      b.forEach((word) => {
        res.push(`${part}${word}`);
      });
    });
  } else {
    return b;
  }

  return res;
}

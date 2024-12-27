import { tokenAssert, TokenStream, unexpectedToken } from "./tokenize";

export function lexConfig(tokens: TokenStream): object {
  tokenAssert(tokens.get(), "WORD", "package");
  tokenAssert(tokens.next(), "DOT");
  const rootName = tokens.next();
  tokenAssert(rootName, "WORD");
  tokenAssert(tokens.next(), "EQUALS");
  tokenAssert(tokens.next(), "BRACE", "{");

  return {
    [rootName.value]: parseObject(tokens),
  };
}

function parseObject(tokens: TokenStream): Record<string, string | object> {
  const root: Record<string, string | object> = {};
  while (tokens.hasNext()) {
    const token = tokens.next();
    let varname = token.value;

    switch (token.type) {
      case "WORD":
        tokenAssert(tokens.next(), "EQUALS");
        root[varname] = parseVariableValue(tokens);
        break;
      case "NUMBER":
        tokens.prev();
        varname = parseSemver(tokens);
        const n = tokens.next();
        tokenAssert(n, "EQUALS");
        root[varname] = parseVariableValue(tokens);
        break;
      case "BRACE":
        tokenAssert(token, "BRACE", "}");
        tokenAssert(tokens.next(), "SEMICOLON");
        return root;
    }
  }

  return root;
}

function parseVariableValue(tokens: TokenStream): string | object {
  let nextToken = tokens.next();
  switch (nextToken.type) {
    case "BRACE":
      return parseObject(tokens);
    case "NUMBER":
      tokens.prev();
      return parseSemver(tokens);
    case "WORD":
      const value = nextToken.value;
      tokenAssert(tokens.next(), "SEMICOLON");
      return value;
    case "PAREN":
      return parseVariableValue(tokens);
    default:
      unexpectedToken(nextToken, "variable definition");
  }
}

function parseSemver(tokens: TokenStream): string {
  let result = "";
  let nextToken = tokens.next();
  tokenAssert(nextToken, "NUMBER");
  result += nextToken.value;

  while (tokens.hasNext()) {
    nextToken = tokens.next();
    switch (nextToken.type) {
      //TODO this is not ideal as foo = 1.0= is now correct syntax
      case "EQUALS":
        tokens.prev();
        return result;
      case "SEMICOLON":
        return result;
      case "DOT":
      case "WORD":
      case "NUMBER":
        result += nextToken.value;
        break;
      case "PAREN":
        //IGNORE PARENTHESES
        break;
      default:
        unexpectedToken(nextToken, "semver parsing");
    }
  }

  return result;
}

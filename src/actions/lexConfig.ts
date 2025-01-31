import { TokenStream } from "./tokenize";

export function lexConfig(tokens: TokenStream, onlyRoot = false): object {
  tokens.assert("WORD", "package");
  tokens.assertNext("DOT");
  const rootName = tokens.next();
  tokens.assert("WORD");
  tokens.assertNext("EQUALS");
  tokens.assertNext("BRACE", "{");

  if (onlyRoot) {
    return {
      [rootName.value]: {},
    };
  }

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
        const aaa = tokens.next();
        if (aaa.type === "NUMBER") {
          varname += aaa.value;
          tokens.assertNext("EQUALS");
          root[varname] = parseVariableValue(tokens);
        } else {
          tokens.assert("EQUALS");
          root[varname] = parseVariableValue(tokens);
        }
        break;
      case "NUMBER":
        tokens.prev();
        varname = parseSemver(tokens);
        tokens.assertNext("EQUALS");
        root[varname] = parseVariableValue(tokens);
        break;
      case "BRACE":
        tokens.assert("BRACE", "}");
        tokens.assertNext("SEMICOLON");
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
      tokens.assertNext("SEMICOLON");
      return value;
    case "PAREN":
      return parseVariableValue(tokens);
    default:
      tokens.unexpectedToken("variable definition");
  }
}

function parseSemver(tokens: TokenStream): string {
  let result = "";
  let nextToken = tokens.next();
  tokens.assert("NUMBER");
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
        tokens.unexpectedToken("Semver parsing");
    }
  }

  return result;
}

export function localToFqn(path: string): string {
  if (path.startsWith('./')) {
    return path.replace('./', `${process.cwd()}/`)
  }

  return path;
}

import * as fs from 'fs/promises';
import { localToFqn } from './local-to-fqn';
import { FileNotFoundError } from '../errors';

//Bet there's an easier way to do this
export async function recursiveStatFile(path: string) {
  const fullPath = localToFqn(path);
  const parts = fullPath.split('/');

  while (parts.length > 1) {
    const currentFilePath = parts.join('/');
    try {
      return {...(await fs.stat(currentFilePath)), path: currentFilePath};
    } catch (e) {
      const fileName = parts.pop() as string;
      parts.pop();
      parts.push(fileName);
    }
  }

  throw new FileNotFoundError(`Looked for ${path} file in ${fullPath} and up. But couldn't find one`);
}
import fs from 'fs/promises';
import path from 'path';

export async function importDir(dirPath: string): Promise<void> {
  const dir = await fs.opendir(dirPath);

  for await (const dirent of dir) {
    const moduleName = path.join(dirPath, dirent.name.replace('.js', ''));
    import(moduleName);
  }
}
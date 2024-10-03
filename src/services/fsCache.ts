import { tmpdir } from "tmp";
import { stat, readFile, writeFile } from "fs/promises";
import path from "path";

export class FsCache {
  static fsCache: FsCache | null = null;
  constructor(
    public readonly filePath: string,
    private readonly cache: Record<string, any>,
  ) {}

  static async instance(): Promise<FsCache> {
    if (FsCache.fsCache) {
      return FsCache.fsCache;
    }

    const cachePath = path.join(tmpdir, "jstools.json");
    FsCache.fsCache = new FsCache(cachePath, await this.loadCache(cachePath));
    return FsCache.fsCache;
  }

  static async save() {
    if (FsCache.fsCache) {
      return await writeFile(
        FsCache.fsCache.filePath,
        FsCache.fsCache.toString(),
      );
    }
  }

  set(key: string, value: any) {
    this.cache[key] = value;
  }

  get<T>(key: string): T | undefined {
    return this.cache[key] as T;
  }

  toString() {
    return JSON.stringify(this.cache);
  }

  private static async loadCache(path: string): Promise<Record<string, any>> {
    console.log("Loading cache from", path);
    if (await this.cacheExists(path)) {
      console.log("Cache exists");
      const cacheValue = JSON.parse((await readFile(path)).toString());
      console.log("Cache value", cacheValue);
      return cacheValue;
    }

    return {};
  }

  private static async cacheExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }
}

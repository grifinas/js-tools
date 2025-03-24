import { recursiveStatFile } from "../utils/fs/recursive-stat-file";
import fs from "fs/promises";
import path from "path";

export async function getPackageJson(from?: string): Promise<PackageJson> {
  const { path, dir } = await recursiveStatFile(`${from ?? "."}/package.json`);
  const buffer = await fs.readFile(path);
  let content = buffer.toString("utf-8");

  return new PackageJson(dir, content);
}

export class PackageJson {
  public readonly name: string;
  public readonly scripts: Record<string, string>;
  public readonly dependencies: Record<string, string>;
  public readonly devDependencies: Record<string, string>;
  private readonly rest: any;
  private readonly order: string[];

  constructor(
    public readonly dir: string,
    content: string,
  ) {
    const jsonContent = JSON.parse(content);
    this.order = Object.keys(jsonContent);
    const {
      name,
      scripts = {},
      dependencies = {},
      devDependencies = {},
      ...rest
    } = jsonContent;
    this.name = name;
    this.scripts = scripts;
    this.dependencies = dependencies;
    this.devDependencies = devDependencies;
    this.rest = rest;
  }

  async save() {
    await fs.writeFile(this.path, this.toJSON());
  }

  toJSON() {
    const data = this.order.reduce(
      (acc, key) => {
        if (key === "name") {
          acc[key] = this.name;
        } else if (key === "scripts") {
          acc[key] = this.scripts;
        } else if (key === "dependencies") {
          acc[key] = this.dependencies;
        } else if (key === "devDependencies") {
          acc[key] = this.devDependencies;
        } else {
          acc[key] = this.rest[key];
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return JSON.stringify(data, null, 2);
  }

  get path(): string {
    return path.join(this.dir, "package.json");
  }

  dependsOn(lib: PackageJson): boolean;
  dependsOn(libName: string): boolean;
  dependsOn(lib: string | PackageJson): boolean {
    const libName = lib instanceof PackageJson ? lib.name : lib;
    return Boolean(
      Object.keys(this.devDependencies).find((key) => key === libName) ||
        Object.keys(this.dependencies).find((key) => key === libName),
    );
  }
}

import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option } from "../utils/stage";
import { getPackageJson, PackageJson } from "../actions/getPackageJson";
import path from "path";
import { listDir } from "../utils/fs/list-dir";
import { getAwsLambdaTransform } from "../actions/getAwsLambdaTransform";
import chalk from "chalk";

@bindCommand(
  "Link a local library to the specified project, similar to npm link, but should work with brazil build",
)
export class LinkLib extends Command {
  builder() {
    return {
      build: option({
        boolean: true,
        default: false,
        alias: "b",
        description:
          "If true, link in the build folder too (not needed when bundling)",
      }),
      unlink: option({
        boolean: true,
        default: false,
        alias: "u",
        description:
          "If true, cleanup the package.json file, removing the link",
      }),
    };
  }

  async handler(args: ArgsOf<this>) {
    const libPackageJson = await getPackageJson(
      this.argAt<string>(1, "Usage: jst link-lib [path-to-lib]"),
    );
    const packageJson = await getPackageJson();

    if (!packageJson.dependsOn(libPackageJson)) {
      console.error(
        `package.json should have ${libPackageJson.path} defined as a dependency. Something like: "${libPackageJson.name}": "*"`,
      );
      return -2;
    }

    unlinkBuildScript(packageJson, libPackageJson);
    if (args.unlink) return await unlinkScripts(packageJson, libPackageJson);

    await addDevScript(packageJson, libPackageJson);

    if (args.build) await addBuildScript(packageJson, libPackageJson);
    await packageJson.save();

    console.log(
      chalk.green(
        `Linked ${libPackageJson.name} from ${libPackageJson.dir} via post scripts`,
      ),
    );
    console.log(chalk.green(`Run brazil-build`));
  }
}

async function unlinkScripts(
  packageJson: PackageJson,
  libPackageJson: PackageJson,
): Promise<number> {
  unlinkDevScript(packageJson, libPackageJson);
  unlinkBuildScript(packageJson, libPackageJson);
  await packageJson.save();
  console.log(
    chalk.green(`Unlinked ${libPackageJson.name} from from post scripts`),
  );
  console.log(chalk.green(`Run brazil-build`));
  return 0;
}

function unlinkDevScript(
  packageJson: PackageJson,
  libPackageJson: PackageJson,
) {
  const { postInstallScriptName } = getCanonicalScriptNames(libPackageJson);

  delete packageJson.scripts[postInstallScriptName];
  removeScript(packageJson, "postinstall", postInstallScriptName);
}

async function addDevScript(
  packageJson: PackageJson,
  libPackageJson: PackageJson,
) {
  const { postInstallScriptName } = getCanonicalScriptNames(libPackageJson);

  addScript(
    packageJson,
    "postinstall",
    postInstallScriptName,
    await getNodeModuleLinks(packageJson, libPackageJson),
  );
}

function unlinkBuildScript(
  packageJson: PackageJson,
  libPackageJson: PackageJson,
) {
  const { postBuildScriptName } = getCanonicalScriptNames(libPackageJson);

  delete packageJson.scripts[postBuildScriptName];
  removeScript(packageJson, "post-npm-pretty-much", postBuildScriptName);
}

async function addBuildScript(
  packageJson: PackageJson,
  libPackageJson: PackageJson,
) {
  const { postBuildScriptName } = getCanonicalScriptNames(libPackageJson);

  addScript(
    packageJson,
    "post-npm-pretty-much",
    postBuildScriptName,
    await getBuildCopy(packageJson, libPackageJson),
  );
}

function getCanonicalScriptNames(libPackageJson: PackageJson) {
  const canonicalName = libPackageJson.name.replace(/([^a-z_-])/gi, "");
  const postInstallScriptName = `__link_lib_install_${canonicalName}`;
  const postBuildScriptName = `__link_lib_build_${canonicalName}`;
  return { postInstallScriptName, postBuildScriptName };
}

function addScript(
  packageJson: PackageJson,
  destinationScript: string,
  execScript: string,
  commands: string[],
): PackageJson {
  packageJson.scripts[execScript] = commands.join(" && ");
  if (!packageJson.scripts[destinationScript]) {
    packageJson.scripts[destinationScript] = `npm run ${execScript}`;
  } else if (!packageJson.scripts[destinationScript].includes(execScript)) {
    packageJson.scripts[destinationScript] += ` && npm run ${execScript}`;
  }

  return packageJson;
}

function removeScript(
  packageJson: PackageJson,
  fromScript: string,
  execScript: string,
): PackageJson {
  if (packageJson.scripts[fromScript]) {
    if (packageJson.scripts[fromScript] === `npm run ${execScript}`) {
      delete packageJson.scripts[fromScript];
    } else {
      packageJson.scripts[fromScript] = packageJson.scripts[fromScript].replace(
        ` && npm run ${execScript}`,
        "",
      );
    }
  }

  return packageJson;
}

async function getBuildCopy(
  destinationPackageJson: PackageJson,
  libPackageJson: PackageJson,
) {
  const libInNodeModules = path.join(
    destinationPackageJson.dir,
    "node_modules",
    libPackageJson.name,
  );

  const { handlerPath } = await getAwsLambdaTransform();
  const libPathInBuild = path.join(
    destinationPackageJson.dir,
    "build",
    handlerPath,
    "node_modules",
    libPackageJson.name,
  );
  return [
    `rm -rf ${libPathInBuild}/*`,
    `cp -rf ${libInNodeModules}/* ${libPathInBuild}/`,
    `cd ${libPathInBuild}`,
    `npm prune --production`,
  ];
}

async function getNodeModuleLinks(
  destinationPackageJson: PackageJson,
  libPackageJson: PackageJson,
): Promise<string[]> {
  const result: string[] = [];

  const libInNodeModules = path.join(
    destinationPackageJson.dir,
    "node_modules",
    libPackageJson.name,
  );

  //Delete all the files in lib
  result.push(`rm -rf ${libInNodeModules}/*`);

  try {
    const contents = await listDir(libInNodeModules);

    for (const file of contents) {
      const destPath = path.join(libInNodeModules, file);
      const sourcePath = path.join(libPackageJson.dir, file);
      result.push(`ln -sf ${sourcePath} ${destPath}`);
    }
  } catch (e) {
    throw new Error(
      `Could not list dir: ${libInNodeModules}, Was ${libPackageJson.name} installed? Try running bb`,
    );
  }

  return result;
}

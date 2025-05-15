import { readCdkTree } from "./readCdkTree";

export async function listAwsServices(): Promise<string[]> {
  const tree = await readCdkTree();
  if (!tree) return [];

  const services = new Set<string>();

  const objects = Object.values(tree.tree.children);

  while (objects.length) {
    const object = objects.pop()!;
    const { fqn } = object.constructInfo;
    if (fqn.startsWith("aws-cdk-lib")) {
      const [_, service, third] = fqn.split(".");
      if (third) services.add(service);
    }
    if (object.children) objects.push(...Object.values(object.children));
  }

  return Array.from(services);
}

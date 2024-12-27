import { ArgsOf, bindCommand, Command } from "../utils/command";
import { readFile } from "fs/promises";

@bindCommand("jq [file-name] parses file")
export class JQ extends Command {
  builder() {
    return {};
  }

  async handler(args: ArgsOf<this>) {
    const json = await this.getJson();
    if (!json) return -1;

    const result = json.filter(
      (value) => value.parent_device_id === 3518 && value.child_device_id === 8,
    );
    console.log(JSON.stringify(result, null, 2));
  }

  async getJson(): Promise<Array<Record<string, any>> | null> {
    const filename = this.argAt<string>(1, "Usage: jst jq [file-name]");
    try {
      const result = (await readFile(filename)).toString();
      return JSON.parse(result) as Array<Record<string, any>>;
    } catch (e) {
      console.error("Expected file to be json, got error: ", e);
      return null;
    }
  }
}

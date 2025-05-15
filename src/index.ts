#!/usr/bin/env node

import "./utils/string/prototype";
import yargs from "yargs";
import path from "path";
import { importDir } from "./utils/importDir";

const commandsDir = path.join(__dirname, "commands");

importDir(commandsDir).then(() => {
  yargs.completion(".zshrc").demandCommand().help().argv;
});

#!/usr/bin/env node

import yargs from "yargs";
import path from "path";
import { importDir } from "./utils/importDir";
import "./utils/string/substringFrom";

const commandsDir = path.join(__dirname, "commands");

importDir(commandsDir).then(() => {
  yargs.completion(".zshrc").demandCommand().help().argv;
});

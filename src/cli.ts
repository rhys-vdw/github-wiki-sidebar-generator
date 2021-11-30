#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { write } from "./index";

const { argv } = yargs(hideBin(process.argv))
  .command(
    "$0 [path]",
    "Generates a GitHub wiki sidebar file",
    (yargs) =>
      yargs.positional("path", {
        description: "Path to wiki root",
        default: process.cwd(),
      })
  )
  .help()
  .alias("help", "h");

write((argv as any).path);

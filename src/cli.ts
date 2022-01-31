#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { write } from "./index";

interface Config {
  title?: string,
}

const configPath = path.join(process.cwd(), "wiki.config.json")
const config = (existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, { encoding: "utf8" }))
  : {}) as Config

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
  .options({
    title: {
      alias: "t",
      describe: "Title of Home page",
      default: config.title ?? "Index"
    }
  })
  .help()
  .alias("help", "h");

write((argv as any).path, (argv as any).title);

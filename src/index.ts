import fs from "fs";
import path from "path";
const ignore = require("ignore-file") as any;

const tab = "  ";

function formatListItem(depth: number, name: string, link?: string): string {
  const indent = tab.repeat(depth);
  return link !== undefined
    ? `${indent}- [[${name}|${link}]]\n`
    : `${indent}- ${name}\n`;
}

function addDirectoryItems(
  doc: string,
  rootPath: string,
  dirPath: string,
  depth: number,
  filter: (path: string) => boolean
): string {
  const files = fs
    .readdirSync(dirPath)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return files.reduce((acc, filename) => {
    if (!(filename.startsWith(".") || filename.startsWith("_"))) {
      const absPath = path.join(dirPath, filename);
      const relPath = path.relative(rootPath, absPath);
      if (!filter(relPath)) {
        const stats = fs.lstatSync(absPath);
        if (stats.isDirectory()) {
          acc += formatListItem(depth, filename);
          acc = addDirectoryItems(acc, rootPath, absPath, depth + 1, filter);
        } else if (filename.endsWith(".md") && stats.isFile()) {
          const name = filename.slice(0, filename.length - ".md".length);
          acc += formatListItem(depth, name, name);
        }
      }
    }
    return acc;
  }, doc);
}

export function generate(root: string): string {
  const filter = ignore.sync(".wikiignore") || ignore.compile("");
  return addDirectoryItems("", root, root, 0, filter);
}

export function write(root: string): void {
  const outPath = path.join(root, "_Sidebar.md");
  fs.writeFileSync(outPath, generate(root));
  console.log(`Created ${outPath}`);
}

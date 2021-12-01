import fs from "fs";
import path from "path";
const ignore = require("ignore-file") as any;

const tab = "  ";

function addDirectoryItems(
  doc: string,
  rootPath: string,
  dirPath: string,
  indent: string,
  filter: (path: string) => boolean
): string {
  const files = fs.readdirSync(dirPath);

  return files.reduce((acc, filename) => {
    if (!(filename.startsWith(".") || filename.startsWith("_"))) {
      const absPath = path.join(dirPath, filename);
      const relPath = path.relative(rootPath, absPath);
      if (!filter(relPath)) {
        const stats = fs.lstatSync(absPath);
        if (stats.isDirectory()) {
          acc += `${indent}- ${filename}\n`;
          acc = addDirectoryItems(acc, rootPath, absPath, indent + tab, filter);
        } else if (filename.endsWith(".md") && stats.isFile()) {
          const name = filename.slice(0, filename.length - ".md".length);
          acc += `${indent}- [[${name}|${name}]]\n`;
        }
      } else {
        console.log("skipping " + absPath);
      }
    }
    return acc;
  }, doc);
}

export function generate(root: string): string {
  const filter = ignore.sync(".wikiignore") || ignore.compile("");
  return addDirectoryItems("", root, root, "", filter);
}

export function write(root: string): void {
  const outPath = path.join(root, "_Sidebar.md");
  fs.writeFileSync(outPath, generate(root));
  console.log(`Created ${outPath}`);
}

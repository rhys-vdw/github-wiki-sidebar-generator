import fs from "fs";
import path from "path";
const ignore = require("ignore-file") as any;

const tab = "  ";

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
          acc += `${tab.repeat(depth)}- ${filename}\n`;
          acc = addDirectoryItems(acc, rootPath, absPath, depth + 1, filter);
        } else if (filename.endsWith(".md") && stats.isFile()) {
          const name = filename.slice(0, filename.length - ".md".length);
          acc += `${tab.repeat(depth)}- [[${name}|${name}]]\n`;
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

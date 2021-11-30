import fs from "fs";
import path from "path";

const tab = "  ";

function addDirectoryItems(doc: string, dirPath: string, indent: string) {
  const files = fs.readdirSync(dirPath);

  return files.reduce((acc, filename) => {
    if (!(filename.startsWith(".") || filename.startsWith("_"))) {
      const absPath = path.join(dirPath, filename);
      const stats = fs.lstatSync(absPath);
      if (stats.isDirectory()) {
        acc += `${indent}- ${filename}\n`
        acc = addDirectoryItems(acc, absPath, indent + tab);
      } else if (filename.endsWith(".md") && stats.isFile()) {
        const name = filename.slice(0, filename.length - ".md".length);
        acc += `${indent}- [[${name}|${name}]]\n`
      }
    }
    return acc;
  }, doc);
}

export function generate(root: string) {
  return addDirectoryItems("", root, "");
}

export function write(root: string) {
  const outPath = path.join(root, "_Sidebar.md");
  fs.writeFileSync(outPath, generate(root));
  console.log(`Created ${outPath}`);
}

import fs, { Stats } from "fs";
import path from "path";
const ignore = require("ignore-file") as any;

const tab = "  ";
const maxHeadingDepth = 6;

function formatListItem(depth: number, name: string, link?: string): string {
  const indent = tab.repeat(depth);
  return link !== undefined
    ? `${indent}- [[${name}|${link}]]\n`
    : `${indent}- ${name}\n`;
}

function formatHeading(depth: number, name: string): string {
  return `${'#'.repeat(Math.min(depth + 1, maxHeadingDepth))} ${name}\n`
}

type Filter = (path: string) => boolean;

interface Formatter {
  page: (depth: number, name: string) => string
  directory: (depth: number, name: string) => string
}

const sidebarFormatter: Formatter = {
  page(depth: number, name: string): string {
    return formatListItem(depth, name, name);
  },
  directory(depth: number, name: string): string {
    return formatListItem(depth, name);
  }
}

const homeFormatter: Formatter = {
  page(_depth: number, name: string): string {
    return formatListItem(0, name, name);
  },
  directory(depth: number, name: string): string {
    return depth < maxHeadingDepth
      ? formatHeading(depth, name)
      : formatListItem(depth - maxHeadingDepth, name);
  }
}

function addDirectoryItems(
  doc: string,
  rootPath: string,
  dirPath: string,
  depth: number,
  filter: Filter,
  formatter: Formatter
): string {
  const files = fs
    .readdirSync(dirPath)
    .map(filename => {
      const absPath = path.join(dirPath, filename);
      return [
        filename,
        absPath,
        fs.lstatSync(absPath)
      ] as [string, string, Stats]
    })
    .sort(([aFile, , aStats], [bFile, , bStats]) => {
      // Sort directories first.
      if (aStats.isDirectory() !== bStats.isDirectory()) {
        return aStats.isDirectory() ? 1 : -1;
      }
      return aFile.localeCompare(bFile, undefined, { sensitivity: "base" })
    });

  return files.reduce((acc, [filename, absPath, stats]) => {
    if (!(filename.startsWith(".") || filename.startsWith("_"))) {
      const relPath = path.relative(rootPath, absPath);
      if (relPath == "Home.md") return acc;
      if (!filter(relPath)) {
        if (stats.isDirectory()) {
          acc += formatter.directory(depth, filename);
          acc = addDirectoryItems(acc, rootPath, absPath, depth + 1, filter, formatter);
        } else if (filename.endsWith(".md") && stats.isFile()) {
          const name = filename.slice(0, filename.length - ".md".length);
          acc += formatter.page(depth, name);
        }
      }
    }
    return acc;
  }, doc);
}

export function generateSidebar(root: string, filter: Filter): string {
  return addDirectoryItems("", root, root, 0, filter, sidebarFormatter);
}

export function generateHome(root: string, title: string, filter: Filter) {
  return addDirectoryItems(formatHeading(0, title), root, root, 1, filter, homeFormatter);
}

export function writeSidebar(root: string, filter: Filter): void {
  const outPath = path.join(root, "_Sidebar.md");
  writeFile(outPath, generateSidebar(root, filter));
}

export function writeHome(root: string, title: string, filter: Filter): void {
  const outPath = path.join(root, "Home.md");
  writeFile(outPath, generateHome(root, title, filter));
}

function writeFile(path: string, content: string) {
  fs.writeFileSync(path, content);
  console.log(`Created ${path}`);
}

export function write(root: string, title: string) {
  const filter = ignore.sync(".wikiignore") || ignore.compile("");
  writeHome(root, title, filter);
  writeSidebar(root, filter);
}

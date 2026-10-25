import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, resolve, relative } from "node:path";

const root = resolve("src");
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk(root);
const fileSet = new Set(files);
const visited = new Set();
async function trace(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(
    /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g,
  )) {
    if (!match[1].startsWith(".")) continue;
    const target = resolve(dirname(file), match[1]);
    const dependency = [
      target,
      `${target}.js`,
      resolve(target, "index.js"),
    ].find((path) => fileSet.has(path));
    if (dependency && [".vue", ".js"].includes(extname(dependency)))
      await trace(dependency);
  }
}
await trace(resolve(root, "main.js"));
const components = files.filter((file) => extname(file) === ".vue");
const unused = components.filter((file) => !visited.has(file));
const routes = await readFile(resolve(root, "router/index.js"), "utf8");
const pages = [...routes.matchAll(/path:\s*['"]([^'"]+)['"]/g)]
  .map((match) => match[1])
  .filter((path) => !path.includes(":pathMatch"));
console.log(`Independent main pages: ${pages.length} (${pages.join(", ")})`);
console.log(
  `Vue SFCs: ${components.length}; reachable from main.js: ${components.length - unused.length}`,
);
for (const file of components)
  console.log(
    `${visited.has(file) ? "USED" : "UNUSED"}  ${relative(process.cwd(), file)}`,
  );
if (pages.length < 3 || components.length - unused.length < 15 || unused.length)
  process.exitCode = 1;

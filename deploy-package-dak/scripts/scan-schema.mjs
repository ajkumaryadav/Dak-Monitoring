import { readdirSync, statSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  let results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walk("src");
const tables = new Set();
const rpcs = new Set();

for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const m of content.matchAll(/\.from\(["']([a-zA-Z0-9_]+)["']\)/g)) {
    tables.add(m[1]);
  }
  for (const m of content.matchAll(/\.rpc\(["']([a-zA-Z0-9_]+)["']/g)) {
    rpcs.add(m[1]);
  }
}

console.log("TABLES USED IN APP:");
console.log(JSON.stringify([...tables].sort(), null, 2));

console.log("RPCS USED IN APP:");
console.log(JSON.stringify([...rpcs].sort(), null, 2));

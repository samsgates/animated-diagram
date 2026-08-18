import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const roots = ["packages", "scripts", "tests"];
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(m?js)$/.test(entry.name)) files.push(full);
  }
}
roots.forEach(walk);

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed = true;
    console.error(result.stderr || `Syntax check failed: ${file}`);
  }
}
if (failed) process.exit(1);
console.log(`Syntax checked ${files.length} JavaScript files.`);

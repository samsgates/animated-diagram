import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repo = "https://github.com/cathrynlavery/diagram-design.git";
const target = path.resolve("upstream/diagram-design");
const update = process.argv.includes("--update");

function run(args, cwd=process.cwd()) {
  const result = spawnSync("git", args, { cwd, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!fs.existsSync(path.join(target, ".git"))) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  run(["clone", "--depth", "1", repo, target]);
  console.log(`Initialized upstream at ${target}`);
} else if (update) {
  run(["fetch", "origin", "main", "--depth", "1"], target);
  run(["checkout", "main"], target);
  run(["reset", "--hard", "origin/main"], target);
  console.log("Updated upstream checkout to origin/main.");
} else {
  console.log("Upstream checkout already exists. Use --update to refresh it.");
}

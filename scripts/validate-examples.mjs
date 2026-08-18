import fs from "node:fs/promises";
import path from "node:path";
import { buildDiagram, validateSpecification, validateHtml } from "@animted-diagram/core";

const root = path.resolve("examples");
const files = [];

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith(".diagram.json")) files.push(full);
  }
}
await walk(root);

let failed = false;
for (const file of files) {
  const spec = JSON.parse(await fs.readFile(file, "utf8"));
  const specReport = validateSpecification(spec);
  if (!specReport.valid) {
    failed = true;
    console.error(file, specReport.errors);
    continue;
  }
  const result = buildDiagram(spec);
  const htmlReport = validateHtml(result.html);
  if (!htmlReport.valid) {
    failed = true;
    console.error(file, htmlReport.errors);
    continue;
  }
  const output = file.replace(/\.diagram\.json$/, ".html");
  await fs.writeFile(output, result.html);
  console.log(`OK ${path.relative(process.cwd(), file)}`);
}
if (failed) process.exit(1);
console.log(`Validated ${files.length} examples.`);

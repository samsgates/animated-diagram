import test from "node:test";
import assert from "node:assert/strict";
import { validateHtml, validateSpecification } from "@animted-diagram/core";

test("validator rejects unsafe external scripts", () => {
  const report=validateHtml(`<!doctype html><svg role="img"><title>x</title><desc>x</desc></svg><style>@media (prefers-reduced-motion:reduce){}</style><script src="https://x.example/a.js"></script>`);
  assert.equal(report.valid,false);
  assert.ok(report.errors.some(e=>/external scripts/i.test(e)));
});

test("spec validator catches bad scenario edge", () => {
  const report=validateSpecification({
    type:"architecture",nodes:[{id:"a"},{id:"b"}],edges:[{id:"ab",from:"a",to:"b"}],
    scenarios:{bad:{edges:["missing"]}}
  });
  assert.equal(report.valid,false);
});

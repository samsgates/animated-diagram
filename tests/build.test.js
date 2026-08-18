import test from "node:test";
import assert from "node:assert/strict";
import { buildDiagram, buildPlanBundle, validateHtml } from "@animted-diagram/core";

const spec = {
  id:"build-test",title:"Build test",description:"Static first animated test.",type:"architecture",
  nodes:[{id:"a",label:"A",type:"client"},{id:"b",label:"B",type:"api"}],
  edges:[{id:"ab",from:"a",to:"b",type:"request",order:1}]
};

test("builds self-contained accessible HTML", () => {
  const {html}=buildDiagram(spec);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/data-ad-root/);
  assert.match(html,/data-ad-flow/);
  assert.match(html,/role="img"/);
  assert.match(html,/<title/);
  assert.match(html,/<desc/);
  assert.match(html,/prefers-reduced-motion/);
  assert.doesNotMatch(html,/<script[^>]+src=/i);
  const report=validateHtml(html);
  assert.equal(report.valid,true,JSON.stringify(report));
});

test("embeds scenario plans", () => {
  const withScenarios={...spec,scenarios:{
    one:{edges:["ab"],label:"One"}
  }};
  const bundle=buildPlanBundle(withScenarios);
  assert.ok(bundle.plans.default);
  assert.ok(bundle.plans.one);
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildDiagram } from "@animted-diagram/core";

test("bar chart receives reveal steps", () => {
  const {html,planBundle}=buildDiagram({
    id:"bars",type:"bar-chart",nodes:[],edges:[],
    data:{items:[{id:"a",label:"A",value:10},{id:"b",label:"B",value:20}]}
  });
  assert.equal(planBundle.plans.default.stepCount,2);
  assert.match(html,/data-ad-item-id="a"/);
  assert.match(html,/data-ad-item-id="b"/);
});

test("gantt renders task marks", () => {
  const {html}=buildDiagram({
    id:"g",type:"gantt",nodes:[],edges:[],
    data:{tasks:[{id:"build",label:"Build",start:0,end:5}]}
  });
  assert.match(html,/data-ad-item-id="build"/);
});

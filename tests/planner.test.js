import test from "node:test";
import assert from "node:assert/strict";
import { planAnimation } from "@animted-diagram/planner";

test("explicit order controls request and response sequence", () => {
  const plan = planAnimation({
    type:"architecture",
    nodes:[{id:"browser"},{id:"api"},{id:"db"}],
    edges:[
      {id:"req",from:"browser",to:"api",type:"request",order:1},
      {id:"write",from:"api",to:"db",type:"write",order:2},
      {id:"dbres",from:"db",to:"api",type:"response",order:3},
      {id:"res",from:"api",to:"browser",type:"response",order:4}
    ]
  });
  assert.equal(plan.stepCount,4);
  assert.deepEqual(plan.steps.map(s=>s.edges[0]),["req","write","dbres","res"]);
});

test("automatic planner keeps outgoing siblings parallel", () => {
  const plan = planAnimation({
    type:"architecture",
    nodes:[{id:"a"},{id:"b"},{id:"c"}],
    edges:[
      {id:"ab",from:"a",to:"b",type:"request"},
      {id:"ac",from:"a",to:"c",type:"async"}
    ]
  });
  assert.equal(plan.stepCount,1);
  assert.deepEqual(new Set(plan.steps[0].edges),new Set(["ab","ac"]));
});

test("response is planned after forward call when order omitted", () => {
  const plan = planAnimation({
    type:"architecture",
    nodes:[{id:"client"},{id:"api"}],
    edges:[
      {id:"req",from:"client",to:"api",type:"request"},
      {id:"res",from:"api",to:"client",type:"response"}
    ]
  });
  assert.deepEqual(plan.steps.map(s=>s.edges[0]),["req","res"]);
});

test("success branch strategy excludes failure path", () => {
  const plan = planAnimation({
    type:"flowchart",
    nodes:[{id:"d"},{id:"yes"},{id:"no"}],
    edges:[
      {id:"success",from:"d",to:"yes",type:"success",condition:"yes"},
      {id:"failure",from:"d",to:"no",type:"failure",condition:"no"}
    ]
  },{branchStrategy:"branch-success"});
  assert.deepEqual(plan.steps.flatMap(s=>s.edges),["success"]);
});

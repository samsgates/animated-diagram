import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGraph, analyzeGraph, detectCycles } from "@animted-diagram/graph";

test("normalizes semantic graph", () => {
  const graph = normalizeGraph({
    type:"architecture",
    nodes:[{id:"a"},{id:"b"}],
    edges:[{id:"ab",from:"a",to:"b",type:"request"}]
  });
  assert.equal(graph.nodes.length,2);
  assert.equal(graph.edges[0].from,"a");
  assert.equal(graph.edges[0].to,"b");
});

test("rejects missing edge endpoints", () => {
  assert.throws(() => normalizeGraph({
    type:"architecture",
    nodes:[{id:"a"}],
    edges:[{id:"bad",from:"a",to:"missing"}]
  }), /missing target/);
});

test("detects branches and roots", () => {
  const analysis = analyzeGraph({
    type:"flowchart",
    nodes:[{id:"a"},{id:"b"},{id:"c"}],
    edges:[
      {id:"ab",from:"a",to:"b",type:"success"},
      {id:"ac",from:"a",to:"c",type:"failure"}
    ]
  });
  assert.deepEqual(analysis.roots,["a"]);
  assert.equal(analysis.branches.length,1);
  assert.equal(analysis.branches[0].node,"a");
});

test("detects strongly connected cycle", () => {
  const cycles = detectCycles(normalizeGraph({
    type:"loop",
    nodes:[{id:"a"},{id:"b"},{id:"c"}],
    edges:[
      {id:"ab",from:"a",to:"b",type:"control"},
      {id:"bc",from:"b",to:"c",type:"control"},
      {id:"ca",from:"c",to:"a",type:"feedback"}
    ]
  }));
  assert.equal(cycles.length,1);
  assert.equal(new Set(cycles[0].nodes).size,3);
});

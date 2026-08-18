import test from "node:test";
import assert from "node:assert/strict";
import { decorateDiagramDesignHtml, inferDiagramDesignBindings } from "@animted-diagram/adapter-diagram-design";

const html=`<!doctype html><html><head></head><body><svg role="img"><title>T</title><desc>D</desc>
<g id="a"></g><g id="b"></g><path id="edge-path" d="M0 0 L10 10"/></svg></body></html>`;
const spec={
  id:"x",type:"architecture",
  nodes:[{id:"a"},{id:"b"}],
  edges:[{id:"ab",from:"a",to:"b",type:"request",order:1}]
};

test("decorates upstream path without changing its geometry", () => {
  const result=decorateDiagramDesignHtml(html,spec,{
    edges:{ab:{pathId:"edge-path"}},
    nodes:{a:{elementId:"a"},b:{elementId:"b"}}
  });
  assert.match(result.html,/data-edge-id="ab"/);
  assert.match(result.html,/<use href="#edge-path"/);
  assert.match(result.html,/d="M0 0 L10 10"/);
  assert.match(result.html,/data-ad-plan/);
  assert.match(result.html,/data-ad-loop-toggle/);
});

test("infers exact matching ids", () => {
  const direct=`<html><body><svg><path id="ab" d="M0 0L1 1"/><g id="a"></g><g id="b"></g></svg></body></html>`;
  const result=inferDiagramDesignBindings(direct,spec);
  assert.equal(result.bindings.edges.ab.pathId,"ab");
  assert.equal(result.unresolved.edges.length,0);
});

test("strict adapter rejects unresolved bindings", () => {
  assert.throws(()=>decorateDiagramDesignHtml(html,spec,{edges:{}},{strict:true}),/Unresolved/);
});

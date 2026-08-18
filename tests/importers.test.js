import test from "node:test";
import assert from "node:assert/strict";
import { importMermaid, importDrawioXml } from "@animted-diagram/importers";

test("imports Mermaid flowchart semantics", () => {
  const graph=importMermaid(`
flowchart LR
  A[Browser] -->|request| B[API]
  B --> C[Database]
`);
  assert.equal(graph.type,"flowchart");
  assert.equal(graph.nodes.length,3);
  assert.equal(graph.edges.length,2);
  assert.equal(graph.edges[0].from,"A");
  assert.equal(graph.edges[0].to,"B");
});

test("imports Mermaid sequence semantics", () => {
  const graph=importMermaid(`
sequenceDiagram
  participant Client
  participant API
  Client->>API: GET /orders
  API-->>Client: 200 OK
`);
  assert.equal(graph.type,"sequence");
  assert.equal(graph.edges[0].type,"request");
  assert.equal(graph.edges[1].type,"response");
});

test("imports uncompressed draw.io XML", () => {
  const graph=importDrawioXml(`
<mxGraphModel><root>
  <mxCell id="1" value="Client" vertex="1"/>
  <mxCell id="2" value="API" vertex="1"/>
  <mxCell id="3" value="calls" edge="1" source="1" target="2"/>
</root></mxGraphModel>`);
  assert.equal(graph.nodes.length,2);
  assert.equal(graph.edges.length,1);
  assert.equal(graph.edges[0].from,"1");
  assert.equal(graph.edges[0].to,"2");
});

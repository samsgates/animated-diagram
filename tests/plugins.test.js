import test from "node:test";
import assert from "node:assert/strict";
import { definePlugin } from "@animted-diagram/plugins";
import { buildDiagram } from "@animted-diagram/core";

test("plugin can transform generated HTML", () => {
  const plugin=definePlugin({
    name:"test-footer",
    transformHtml(html){return html.replace("</body>","<!-- plugin-ok --></body>");}
  });
  const result=buildDiagram({
    type:"architecture",
    nodes:[{id:"a"},{id:"b"}],
    edges:[{id:"ab",from:"a",to:"b",type:"request"}]
  },{plugins:[plugin]});
  assert.match(result.html,/plugin-ok/);
});

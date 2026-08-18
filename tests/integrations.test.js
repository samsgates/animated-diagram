import test from "node:test";
import assert from "node:assert/strict";
import { createReactAnimatedDiagram, createVueAnimatedDiagram } from "@animted-diagram/integrations";

const spec={type:"architecture",nodes:[{id:"a"},{id:"b"}],edges:[{id:"ab",from:"a",to:"b",type:"request"}]};

test("React factory is dependency injected", () => {
  const React={createElement:(type,props)=>({type,props})};
  const Component=createReactAnimatedDiagram(React);
  const view=Component({spec});
  assert.equal(view.type,"iframe");
  assert.match(view.props.srcDoc,/data-ad-root/);
});

test("Vue factory is dependency injected", () => {
  const Vue={
    defineComponent:x=>x,
    h:(type,props)=>({type,props})
  };
  const Component=createVueAnimatedDiagram(Vue);
  const render=Component.setup({spec,options:{},title:""});
  const view=render();
  assert.equal(view.type,"iframe");
  assert.match(view.props.srcdoc,/data-ad-root/);
});

# Framework integrations

## Web Component

```js
import { defineAnimatedDiagramElement } from "@animted-diagram/integrations";

defineAnimatedDiagramElement();
```

```html
<animated-diagram>
  <script type="application/json">
    {
      "type": "architecture",
      "nodes": [
        {"id": "a"},
        {"id": "b"}
      ],
      "edges": [
        {"id": "ab", "from": "a", "to": "b", "type": "request"}
      ]
    }
  </script>
</animated-diagram>
```

The component renders the self-contained diagram in a sandboxed iframe.

## React

The package avoids a hard React dependency.

```js
import React from "react";
import { createReactAnimatedDiagram } from "@animted-diagram/integrations";

const AnimatedDiagram = createReactAnimatedDiagram(React);

export function View() {
  return <AnimatedDiagram spec={spec} options={{preset: "technical"}} />;
}
```

## Vue

```js
import * as Vue from "vue";
import { createVueAnimatedDiagram } from "@animted-diagram/integrations";

export const AnimatedDiagram = createVueAnimatedDiagram(Vue);
```

Dependency injection keeps the core package framework-neutral.

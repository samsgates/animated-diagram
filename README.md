# animted-diagram

Logic-aware HTML + SVG animated diagrams.

`animted-diagram` is a wrapper framework designed to sit above
[`cathrynlavery/diagram-design`](https://github.com/cathrynlavery/diagram-design).
The upstream project owns editorial diagram design. This project adds a semantic
graph, flow analysis, animation planning, animated SVG connectors, runtime
controls, scenarios, validation, and a CLI.

The framework is static-first. Every relationship is visible without JavaScript.
Animation explains flow, sequence, branching, retries, responses, loops, streams,
and parallel work.

## What makes it different

Most SVG animation systems know geometry. They do not know meaning.

`animted-diagram` represents every connection as a semantic edge:

```json
{
  "id": "api-db",
  "from": "api",
  "to": "database",
  "type": "write"
}
```

The animation engine therefore knows that movement must go from `api` toward
`database`, even if the database is visually positioned above or to the left.

Supported semantic edge types include:

`request`, `response`, `data`, `control`, `event`, `async`, `dependency`,
`feedback`, `retry`, `return`, `success`, `failure`, `conditional`, `stream`,
`replication`, `publish`, `subscribe`, `read`, `write`, `trigger`, and `handoff`.

## Features

- Semantic Diagram Graph
- Automatic source to target flow direction
- Request and response ordering
- Parallel branch detection
- Cycle and feedback detection using Tarjan SCC
- Dotted, dashed, draw, pulse, trail, token, and fade connector motion
- Explicit edge ordering when exact narrative order matters
- Automatic ordering when no order is supplied
- Scenarios such as success, failure, timeout, and retry
- Branch strategies: all, success, failure, interactive
- Play, pause, previous, next, replay, speed controls
- Keyboard controls
- Reduced-motion and print-safe static output
- Node relationship highlighting
- Edge group toggles
- Self-contained HTML output
- Built-in SVG renderer
- Adapter for existing `diagram-design` HTML/SVG
- CLI validation and explain mode
- No runtime network dependency
- No external JavaScript dependency
- Node test suite and GitHub Actions CI
- Agent Skill instructions
- Mermaid and uncompressed draw.io semantic importers
- Plugin hooks
- Web Component plus React/Vue integration factories

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Git, only when initializing the optional upstream checkout

No runtime dependencies are required outside this repository.

## Install

Clone your own repository after uploading this project:

```bash
git clone <your-repository-url>
cd animted-diagram
npm install
npm run check
```

Initialize the optional upstream `diagram-design` checkout:

```bash
npm run upstream:init
```

or use the included submodule definition:

```bash
git submodule update --init --recursive
```

The project works without the upstream checkout for direct semantic JSON builds.
The upstream checkout is needed when you want to use exact upstream templates,
skills, assets, and editorial rendering workflows.

## Quick start

Create a specification:

```json
{
  "version": 1,
  "id": "checkout-flow",
  "title": "Checkout flow",
  "type": "architecture",
  "nodes": [
    {"id": "browser", "label": "Browser", "type": "client"},
    {"id": "api", "label": "API", "type": "api"},
    {"id": "db", "label": "PostgreSQL", "type": "database"}
  ],
  "edges": [
    {
      "id": "request",
      "from": "browser",
      "to": "api",
      "type": "request",
      "order": 1
    },
    {
      "id": "write",
      "from": "api",
      "to": "db",
      "type": "write",
      "order": 2
    },
    {
      "id": "db-result",
      "from": "db",
      "to": "api",
      "type": "response",
      "order": 3
    },
    {
      "id": "response",
      "from": "api",
      "to": "browser",
      "type": "response",
      "order": 4
    }
  ]
}
```

Build:

```bash
node packages/cli/src/cli.js build checkout.diagram.json -o checkout.html
```

Open `checkout.html` in a browser.

## CLI

### Build

```bash
animated-diagram build system.diagram.json -o system.html
```

### Explain inferred logic

```bash
animated-diagram explain system.diagram.json
```

Example:

```text
Diagram: checkout-flow
Type: architecture
Behavior: flow
Roots: browser
Leaves: db
Steps: 4

Timeline:
  1. browser → api
  2. api → db
  3. db → api
  4. api → browser
```

### Analyze graph structure

```bash
animated-diagram analyze system.diagram.json
```

Reports:

- roots
- leaves
- cycles
- branches
- request/response pairs
- unreachable nodes
- forward levels

### Validate

```bash
animated-diagram validate system.diagram.json
animated-diagram validate system.html
```

HTML validation checks accessible SVG structure, reduced-motion support, unsafe
remote scripts, `javascript:` URLs, `eval()`, and animation plan metadata.

### Scaffold

```bash
animated-diagram init ./demo
```

### Animate an existing diagram-design HTML file

First add stable IDs to the connector paths in the source diagram.

Example upstream path:

```html
<path id="checkout-api-path" d="M 100 200 H 300" />
```

Create bindings:

```json
{
  "edges": {
    "request": {
      "pathId": "checkout-api-path"
    }
  },
  "nodes": {
    "browser": {
      "elementId": "browser-node"
    }
  }
}
```

Then run:

```bash
animated-diagram animate upstream.html \
  --graph checkout.diagram.json \
  --bindings bindings.json \
  -o checkout.animated.html
```

If upstream element IDs already match semantic IDs, try:

```bash
animated-diagram infer-bindings upstream.html \
  --graph checkout.diagram.json \
  -o bindings.json
```

## Import existing text formats

Mermaid:

```bash
animated-diagram import-mermaid architecture.mmd \
  -o architecture.diagram.json
```

Uncompressed draw.io XML:

```bash
animated-diagram import-drawio architecture.drawio \
  -o architecture.diagram.json
```

See `docs/importers.md` for scope and upstream fallbacks.

## Framework integrations

The repository includes a Web Component and factory-based React/Vue wrappers.

See `docs/integrations.md`.

## Plugin API

Graph, plan, and final HTML transforms are supported through deterministic
plugin hooks.

See `docs/plugins.md`.

## Programmatic API

```js
import { buildDiagram } from "@animted-diagram/core";

const { html, graph, planBundle } = buildDiagram(spec, {
  preset: "technical",
  scenario: "success"
});
```

Write the result anywhere:

```js
import fs from "node:fs/promises";

await fs.writeFile("diagram.html", html);
```

## Animation presets

- `subtle`
- `normal`
- `technical`
- `presentation`
- `educational`
- `cinematic`
- `fast`
- `none`

Example:

```bash
animated-diagram build system.diagram.json \
  --preset educational
```

## Edge animation overrides

```json
{
  "id": "event-stream",
  "from": "kafka",
  "to": "worker",
  "type": "stream",
  "animation": {
    "style": "dots",
    "duration": 800,
    "gap": 11,
    "dotSize": 2.5,
    "continuous": true
  }
}
```

Supported styles:

- `dots`
- `dash`
- `draw`
- `pulse`
- `trail`
- `token`
- `fade`
- `none`

## Automatic direction

Direction is not inferred from screen orientation.

This:

```json
{"from": "api", "to": "database"}
```

always animates from API toward Database.

If an upstream SVG path happens to be authored in the opposite geometric
direction, set the binding override:

```json
{
  "edges": {
    "api-db": {
      "pathId": "existing-path",
      "reverse": true
    }
  }
}
```

## Parallel flow

When multiple forward edges leave the same node at the same semantic level,
the planner puts them in the same animation step.

```text
Orders
  -> PostgreSQL
  -> Redis
```

Both paths animate together.

Set:

```json
{
  "config": {
    "sequence": {
      "parallel": false
    }
  }
}
```

to force serial animation.

## Cycles and loops

The graph engine uses strongly connected component analysis to identify cycles.
Feedback, retry, stream, and replication semantics can use continuous flow
overlays without changing the static diagram.

```json
{
  "id": "retry",
  "from": "worker",
  "to": "queue",
  "type": "retry"
}
```

## Branches

Global branch configuration:

```json
{
  "config": {
    "branch": {
      "strategy": "branch-success"
    }
  }
}
```

Strategies:

- `branch-all`
- `branch-success`
- `branch-failure`
- `interactive`

For exact user-selectable execution paths, define scenarios.

## Scenarios

```json
{
  "scenarios": {
    "success": {
      "label": "Success flow",
      "edges": ["request", "payment", "save", "response"]
    },
    "failure": {
      "label": "Failure flow",
      "edges": ["request", "payment", "payment-error"]
    }
  }
}
```

The generated HTML embeds all scenario plans. The scenario selector changes the
animation timeline without fetching anything from a server.

## Flow groups

Assign an edge group:

```json
{
  "id": "metrics",
  "from": "api",
  "to": "observability",
  "type": "async",
  "group": "Monitoring"
}
```

Generated controls allow the viewer to hide or show that group.

## Diagram types

The semantic schema recognizes the upstream visual families:

- architecture
- flowchart
- sequence
- state-machine
- ER/data model
- timeline
- swimlane
- quadrant
- nested
- tree
- org chart
- Venn
- layer stack
- pyramid
- consultant 2x2
- radar
- loop
- IT current-state
- high-level
- bar chart
- line chart
- Gantt
- scatter plot
- process
- medallion
- data flow
- DP integration
- DP security matrix

The built-in renderer provides flow-oriented output and specialized renderers
for sequence, loop, bar, line, scatter, Gantt, security matrix, Venn, pyramid,
layer stack, medallion, quadrant, 2x2, and radar diagrams.

For exact upstream visual fidelity, generate the static file with
`diagram-design`, add stable element IDs, then pass it through the adapter.

## Architecture

```text
Prompt / JSON / Upstream SVG
          |
          v
Semantic Graph
          |
          v
Graph Analyzer
  |       |       |
  v       v       v
Direction Branch  Cycle
Analysis  Analysis Analysis
          |
          v
Animation Planner
          |
          +------------------+
          |                  |
          v                  v
Built-in SVG Renderer   diagram-design Adapter
          |                  |
          +--------+---------+
                   |
                   v
        Self-contained HTML
                   |
                   v
         Lightweight Runtime
```

The browser does not guess system semantics. The server-side compiler produces a
deterministic plan first, then the browser executes that plan.

See `docs/architecture.md` for the detailed design.

## Static-first contract

The base SVG relationships remain visible before animation.

The runtime adds decorative flow overlays. If JavaScript fails, the complete
diagram is still readable.

When the user enables reduced motion:

- moving connector overlays are hidden
- chart marks are shown fully
- controls are hidden
- the final static diagram remains available

`?motion=static` also forces the static presentation.

## Security model

Generated output does not require:

- remote scripts
- `eval`
- remote fonts
- dynamic fetches
- runtime HTML injection
- `javascript:` links

Imported upstream HTML should come from a trusted `diagram-design` generation
workflow. The adapter only adds attributes, decorative `<use>` or path overlays,
controls, a JSON plan, CSS, and the local runtime.

See `SECURITY.md`.

## Repository layout

```text
animted-diagram/
  packages/
    graph/
    planner/
    runtime/
    svg/
    core/
    adapter-diagram-design/
    cli/
  skills/
    animated-diagram/
  examples/
  docs/
  scripts/
  tests/
  upstream/
```

## Upstream strategy

This repository includes `.gitmodules` plus a bootstrap script.

```bash
npm run upstream:init
```

clones:

```text
https://github.com/cathrynlavery/diagram-design.git
```

into:

```text
upstream/diagram-design
```

The wrapper avoids hard dependencies on upstream internals. This allows the
upstream checkout to be updated independently.

## Development

```bash
npm install
npm test
npm run lint
npm run validate:examples
npm run check
```

Build the main example:

```bash
npm run example:build
```

## CI

`.github/workflows/ci.yml` runs on pushes and pull requests.

It verifies:

- Node syntax
- unit tests
- planner behavior
- adapter behavior
- generated HTML accessibility/security checks
- example builds

## Accessibility

- SVG `role="img"`
- SVG `<title>` and `<desc>`
- keyboard operation
- visible native controls
- `aria-live` status
- no semantic information exists only in animation
- reduced-motion fallback
- print-safe output
- static base connectors
- focus-visible styling

## License

Wrapper code: MIT.

The optional upstream checkout is also MIT licensed and retains its own license
and copyright notices. See `THIRD_PARTY_LICENSES.md`.

# Architecture

## Design goal

Animation is compiled from semantics, not inferred from arbitrary pixel
positions in the browser.

## Components

### Semantic graph

`packages/graph` normalizes and validates diagram nodes, edges, scenarios, and
configuration. It computes adjacency, source/target direction, roots, leaves,
branches, forward levels, strongly connected components, request/response
pairs, and unreachable nodes.

### Planner

`packages/planner` converts graph relationships into deterministic animation
steps.

Forward relationships are planned before return relationships. Explicit
`order` values take priority when every selected edge has an order.

Outgoing sibling edges can share a step for parallel animation.

### SVG renderer

`packages/svg` contains a standalone renderer so CI and server-side generation
do not depend on a browser or the upstream project.

Every base edge is visible. Decorative animation overlays carry semantic data
attributes.

### Runtime

`packages/runtime` provides the small browser controller and CSS.

The runtime:

- never fetches network resources
- never measures SVG paths
- never mutates semantic labels
- reads a precompiled plan
- handles controls and keyboard input
- pauses on page hide
- respects reduced motion
- switches embedded scenario plans

### diagram-design adapter

`packages/adapter-diagram-design` augments an existing upstream HTML file.

It binds semantic edges to stable upstream path IDs and inserts `<use>` flow
overlays. The base geometry stays owned by upstream.

This makes the integration tolerant of upstream visual changes.

## Data flow

```text
DiagramSpecification
        |
        v
normalizeGraph()
        |
        v
analyzeGraph()
        |
        v
planAnimation()
        |
        +----------------+
        |                |
        v                v
renderSvg()      decorateDiagramDesignHtml()
        |                |
        +-------+--------+
                |
                v
         animation plan
                |
                v
       self-contained HTML
```

## Compile-time versus runtime responsibility

Compile time owns:

- semantic validation
- direction
- branch strategy
- request/response order
- cycles
- scenario filtering
- step grouping
- animation style selection

Runtime owns:

- current step
- play/pause
- timing
- speed
- visual activation
- scenario plan switching
- node focus
- flow-group visibility

## Why not runtime path inference

A browser can inspect SVG geometry but geometry is ambiguous.

A line from the right side of a database to the left side of an API does not
tell the browser whether it is a query, response, replication, dependency, or
feedback path.

The semantic graph solves that ambiguity before output is generated.

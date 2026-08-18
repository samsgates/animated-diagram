# Importers

## Mermaid

The built-in Mermaid importer is text-only and intentionally supports a focused
semantic subset.

Supported inputs:

- `flowchart`
- `graph`
- `sequenceDiagram`
- `stateDiagram` style transitions represented with simple arrows

Examples:

```bash
animated-diagram import-mermaid architecture.mmd -o architecture.diagram.json
```

The importer extracts node IDs, labels, message direction, sequence order, and
basic decision semantics.

For advanced Mermaid grammar, use the upstream `diagram-design` import workflow,
then bind the generated SVG with the adapter.

## draw.io

The built-in draw.io importer accepts uncompressed XML containing `mxCell`
vertices and edges.

```bash
animated-diagram import-drawio architecture.drawio -o architecture.diagram.json
```

It extracts:

- vertex IDs
- labels
- edge source/target relationships
- edge labels

Compressed, embedded PNG, and embedded SVG draw.io containers should be handled
by the upstream `diagram-design` importer, which has broader container support.

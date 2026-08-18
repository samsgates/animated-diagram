---
name: animated-diagram
description: Generate logic-aware self-contained HTML + SVG animated diagrams using semantic flow planning.
license: MIT
metadata:
  version: 1.0.0
---

# Animated Diagram Skill

Use this skill when motion materially clarifies order, propagation, request and
response direction, branching, retry logic, asynchronous flow, or feedback.

## Workflow

1. Identify the diagram purpose.
2. Choose the nearest visual type.
3. Identify semantic nodes.
4. Identify directed relationships.
5. Assign each relationship `from`, `to`, and `type`.
6. Identify exact narrative order if it is known.
7. Identify conditional branches.
8. Identify parallel relationships.
9. Identify feedback, retry, response, and stream paths.
10. Create a Diagram Semantic Graph JSON file.
11. Validate it.
12. Generate static editorial SVG directly or with diagram-design.
13. Compile the animation plan.
14. Confirm that every animated path moves in semantic source-to-target direction.
15. Verify reduced-motion and static output.
16. Save the self-contained HTML.

## Hard rules

- Do not derive direction only from left/right or top/bottom positions.
- Do not hide meaning until animation plays.
- Do not animate passive dependencies as if traffic continuously moves through them.
- Use response and return edge types for reverse calls.
- Use feedback or retry semantics for loops.
- Use scenarios when multiple valid execution paths would otherwise be misleading.
- Keep labels semantic and animation overlays decorative.
- Preserve SVG title and description.
- Keep the output usable when JavaScript is disabled.

# Accessibility

## Static-first

All base nodes, labels, and connectors are visible in the source SVG.

Animated paths are decorative overlays.

## Reduced motion

`prefers-reduced-motion: reduce`:

- hides animated overlays
- exposes all chart marks
- hides controls
- keeps the complete static diagram

## Keyboard

When focus is inside the diagram root:

- Right Arrow: next
- Left Arrow: previous
- Home: reset
- End: final step
- Space: play or pause
- R: replay
- L: loop toggle

Native controls remain available for keyboard users.

## SVG naming

Every built-in SVG includes:

- `role="img"`
- `<title>`
- `<desc>`
- `aria-labelledby`

## Motion safety

The default styles avoid flashing, bounce, shake, zoom, and large spatial
movement.

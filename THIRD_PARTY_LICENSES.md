# Third-party licenses

## diagram-design

This project is designed to wrap and optionally vendor the upstream project:

- Project: `cathrynlavery/diagram-design`
- Repository: `https://github.com/cathrynlavery/diagram-design`
- License: MIT
- Upstream skill version observed during project creation: 2.4

When `scripts/bootstrap-upstream.mjs` clones the upstream repository into
`upstream/diagram-design`, the upstream copyright and license files remain
unchanged in that directory.

The wrapper code in this repository does not copy the upstream runtime
controller or templates. It integrates through metadata, path bindings, and
an adapter layer. This intentionally keeps upstream replacement straightforward.

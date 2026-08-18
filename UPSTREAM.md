# Upstream integration

`animted-diagram` is a wrapper architecture around `diagram-design`.

The repository is functional without the upstream checkout because it includes
a semantic graph compiler and a built-in SVG renderer for CI, server-side
generation, and tests.

For exact upstream editorial templates, initialize the optional checkout:

```bash
npm run upstream:init
```

or:

```bash
git submodule update --init --recursive
```

The adapter in `packages/adapter-diagram-design` binds semantic graph edges to
path IDs in an upstream-generated HTML/SVG file. This avoids changing upstream
internals and makes it possible to update `diagram-design` independently.

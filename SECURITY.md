# Security policy

## Supported version

The latest `1.x` release is supported.

## Reporting

Do not publish an exploitable security issue before a fix is available. Use the
security reporting mechanism of the repository where this project is hosted.

## Threat model

The library generates self-contained HTML and can also augment existing inline
SVG.

Treat arbitrary third-party HTML as untrusted. Sanitize it before adapter use.

The generated runtime intentionally avoids `eval`, remote scripts, and network
requests.

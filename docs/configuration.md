# Configuration

Configuration is merged in this order:

1. framework defaults
2. preset
3. diagram configuration
4. CLI or programmatic options
5. edge animation overrides

## Diagram configuration

```json
{
  "config": {
    "preset": "technical",
    "animation": {
      "duration": 1100,
      "gap": 7,
      "dotSize": 1.8
    },
    "sequence": {
      "parallel": true,
      "delay": 260,
      "hold": 820
    },
    "loop": {
      "enabled": "auto",
      "pause": 500,
      "iterations": "infinite"
    },
    "branch": {
      "strategy": "branch-all"
    },
    "maxSteps": 64
  }
}
```

## Presets

`subtle`, `normal`, `technical`, `presentation`, `educational`, `cinematic`,
`fast`, `none`.

## Continuous edge semantics

The planner treats these as continuous by default:

- `stream`
- `feedback`
- `replication`

Override with:

```json
{
  "animation": {
    "continuous": false
  }
}
```

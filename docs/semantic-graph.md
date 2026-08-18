# Semantic graph schema

## Diagram

```json
{
  "version": 1,
  "id": "system",
  "title": "System",
  "description": "System request flow",
  "type": "architecture",
  "theme": "light",
  "nodes": [],
  "edges": [],
  "scenarios": {},
  "data": {},
  "config": {}
}
```

## Node

```json
{
  "id": "api",
  "label": "Orders API",
  "type": "api",
  "group": "Application",
  "metadata": {
    "width": 170,
    "height": 68
  }
}
```

Optional explicit position:

```json
{
  "position": {
    "x": 400,
    "y": 240
  }
}
```

## Edge

```json
{
  "id": "api-db",
  "from": "api",
  "to": "db",
  "type": "write",
  "label": "INSERT",
  "order": 3,
  "group": "Checkout",
  "condition": "valid",
  "priority": 0,
  "animation": {
    "style": "dash",
    "duration": 900
  }
}
```

## Direction contract

`from` is the semantic source.

`to` is the semantic destination.

Screen orientation does not change this contract.

## Scenarios

```json
{
  "scenarios": {
    "success": {
      "label": "Success",
      "edges": ["a", "b", "c"]
    }
  }
}
```

## Chart data

Bar:

```json
{
  "data": {
    "items": [
      {"id": "api", "label": "API", "value": 42}
    ]
  }
}
```

Line:

```json
{
  "data": {
    "points": [
      {"id": "jan", "label": "Jan", "value": 12}
    ]
  }
}
```

Scatter:

```json
{
  "data": {
    "points": [
      {"id": "a", "x": 20, "y": 70, "label": "A"}
    ]
  }
}
```

Gantt:

```json
{
  "data": {
    "tasks": [
      {"id": "design", "label": "Design", "start": 0, "end": 4}
    ]
  }
}
```

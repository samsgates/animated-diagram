const BACK_EDGE_TYPES = new Set(["response", "return", "feedback", "retry"]);
const PASSIVE_EDGE_TYPES = new Set(["dependency"]);
const FLOW_EDGE_TYPES = new Set([
  "request", "response", "data", "control", "event", "async", "feedback",
  "retry", "return", "success", "failure", "conditional", "stream",
  "replication", "publish", "subscribe", "read", "write", "trigger", "handoff"
]);

export const DIAGRAM_TYPES = Object.freeze([
  "architecture", "flowchart", "sequence", "state-machine", "er", "timeline",
  "swimlane", "quadrant", "nested", "tree", "org-chart", "venn", "layer-stack",
  "pyramid", "consultant-2x2", "radar", "loop", "it-current-state", "high-level",
  "bar-chart", "line-chart", "gantt", "scatter-plot", "process", "medallion",
  "data-flow", "dp-integration", "dp-security-matrix"
]);

export const NODE_TYPES = Object.freeze([
  "user", "client", "frontend", "service", "api", "gateway", "worker", "queue",
  "database", "cache", "storage", "event-bus", "external", "decision", "process",
  "state", "actor", "security", "monitoring", "container", "group", "output"
]);

export const EDGE_TYPES = Object.freeze([
  "request", "response", "data", "control", "event", "async", "dependency",
  "feedback", "retry", "return", "success", "failure", "conditional", "stream",
  "replication", "publish", "subscribe", "read", "write", "trigger", "handoff"
]);

function asArray(value) { return Array.isArray(value) ? value : []; }

function safeId(value, fallback) {
  const raw = String(value ?? fallback ?? "").trim();
  if (!raw) throw new Error("Every node and edge requires a non-empty id.");
  return raw;
}

function normalizeScenarioMap(scenarios) {
  if (!scenarios) return {};
  const out = {};
  for (const [name, value] of Object.entries(scenarios)) {
    out[name] = Array.isArray(value)
      ? { edges: value.map(String) }
      : {
          edges: asArray(value.edges).map(String),
          nodes: asArray(value.nodes).map(String),
          label: value.label ? String(value.label) : undefined
        };
  }
  return out;
}

export function normalizeGraph(input) {
  if (!input || typeof input !== "object") throw new Error("Diagram specification must be an object.");
  const type = input.type || "architecture";
  if (!DIAGRAM_TYPES.includes(type)) throw new Error(`Unsupported diagram type "${type}".`);

  const nodes = asArray(input.nodes).map((node, index) => ({
    id: safeId(node.id, `node-${index + 1}`),
    label: String(node.label ?? node.id ?? `Node ${index + 1}`),
    type: NODE_TYPES.includes(node.type) ? node.type : (node.type || "process"),
    group: node.group ? String(node.group) : undefined,
    position: node.position && Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
      ? { x: Number(node.position.x), y: Number(node.position.y) }
      : undefined,
    metadata: node.metadata && typeof node.metadata === "object" ? { ...node.metadata } : {}
  }));

  const nodeIds = new Set();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) throw new Error(`Duplicate node id "${node.id}".`);
    nodeIds.add(node.id);
  }

  const edges = asArray(input.edges).map((edge, index) => {
    const id = safeId(edge.id, `edge-${index + 1}`);
    const from = safeId(edge.from, "");
    const to = safeId(edge.to, "");
    if (!nodeIds.has(from)) throw new Error(`Edge "${id}" references missing source "${from}".`);
    if (!nodeIds.has(to)) throw new Error(`Edge "${id}" references missing target "${to}".`);
    return {
      id, from, to,
      type: EDGE_TYPES.includes(edge.type) ? edge.type : (edge.type || "data"),
      label: edge.label ? String(edge.label) : "",
      order: Number.isFinite(edge.order) ? Number(edge.order) : undefined,
      group: edge.group ? String(edge.group) : undefined,
      condition: edge.condition ? String(edge.condition) : undefined,
      reverse: Boolean(edge.reverse),
      priority: Number.isFinite(edge.priority) ? Number(edge.priority) : 0,
      animation: edge.animation && typeof edge.animation === "object" ? { ...edge.animation } : {},
      metadata: edge.metadata && typeof edge.metadata === "object" ? { ...edge.metadata } : {}
    };
  });

  const edgeIds = new Set();
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge id "${edge.id}".`);
    edgeIds.add(edge.id);
  }

  return {
    version: Number(input.version || 1),
    id: String(input.id || "animated-diagram"),
    title: String(input.title || "Animated Diagram"),
    description: String(input.description || ""),
    type,
    theme: input.theme === "dark" ? "dark" : "light",
    nodes, edges,
    scenarios: normalizeScenarioMap(input.scenarios),
    data: input.data && typeof input.data === "object" ? structuredClone(input.data) : {},
    config: input.config && typeof input.config === "object" ? structuredClone(input.config) : {}
  };
}

export function buildAdjacency(graph) {
  const outgoing = new Map(graph.nodes.map(n => [n.id, []]));
  const incoming = new Map(graph.nodes.map(n => [n.id, []]));
  for (const edge of graph.edges) {
    outgoing.get(edge.from).push(edge);
    incoming.get(edge.to).push(edge);
  }
  return { outgoing, incoming };
}

export function tarjanScc(graph) {
  const { outgoing } = buildAdjacency(graph);
  let index = 0;
  const stack = [], onStack = new Set(), indices = new Map(), low = new Map(), components = [];
  function visit(nodeId) {
    indices.set(nodeId, index); low.set(nodeId, index); index += 1;
    stack.push(nodeId); onStack.add(nodeId);
    for (const edge of outgoing.get(nodeId) || []) {
      const next = edge.to;
      if (!indices.has(next)) {
        visit(next); low.set(nodeId, Math.min(low.get(nodeId), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(nodeId, Math.min(low.get(nodeId), indices.get(next)));
      }
    }
    if (low.get(nodeId) === indices.get(nodeId)) {
      const component = []; let member;
      do { member = stack.pop(); onStack.delete(member); component.push(member); } while (member !== nodeId);
      components.push(component);
    }
  }
  for (const node of graph.nodes) if (!indices.has(node.id)) visit(node.id);
  return components;
}

export function detectCycles(graph) {
  const components = tarjanScc(graph), edgeByNode = buildAdjacency(graph).outgoing, cycles = [];
  for (const component of components) {
    if (component.length > 1) {
      const members = new Set(component);
      const edges = component.flatMap(id => (edgeByNode.get(id) || []).filter(edge => members.has(edge.to)));
      cycles.push({ nodes: component, edges: edges.map(e => e.id) });
      continue;
    }
    const only = component[0];
    const self = (edgeByNode.get(only) || []).filter(edge => edge.to === only);
    if (self.length) cycles.push({ nodes: [only], edges: self.map(e => e.id) });
  }
  return cycles;
}

export function forwardEdges(graph) {
  return graph.edges.filter(edge => !BACK_EDGE_TYPES.has(edge.type) && !PASSIVE_EDGE_TYPES.has(edge.type));
}

export function computeForwardLevels(graph) {
  const edges = forwardEdges(graph);
  const outgoing = new Map(graph.nodes.map(n => [n.id, []]));
  const indegree = new Map(graph.nodes.map(n => [n.id, 0]));
  for (const edge of edges) {
    outgoing.get(edge.from).push(edge);
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  }
  const queue = graph.nodes.filter(n => indegree.get(n.id) === 0).map(n => n.id);
  const level = new Map(graph.nodes.map(n => [n.id, 0]));
  let seen = 0;
  while (queue.length) {
    const id = queue.shift(); seen += 1;
    for (const edge of outgoing.get(id)) {
      level.set(edge.to, Math.max(level.get(edge.to), level.get(id) + 1));
      indegree.set(edge.to, indegree.get(edge.to) - 1);
      if (indegree.get(edge.to) === 0) queue.push(edge.to);
    }
  }
  if (seen < graph.nodes.length) {
    for (let pass = 0; pass < graph.nodes.length; pass += 1) {
      let changed = false;
      for (const edge of edges) {
        if (level.get(edge.to) <= level.get(edge.from) && edge.to !== edge.from) {
          const next = Math.min(graph.nodes.length - 1, level.get(edge.from) + 1);
          if (next !== level.get(edge.to)) { level.set(edge.to, next); changed = true; }
        }
      }
      if (!changed) break;
    }
  }
  return level;
}

export function detectBranches(graph) {
  const { outgoing } = buildAdjacency(graph);
  return graph.nodes.map(node => {
    const edges = (outgoing.get(node.id) || []).filter(e => !PASSIVE_EDGE_TYPES.has(e.type));
    if (edges.length < 2) return null;
    return { node: node.id, edges: edges.map(e => e.id), conditional: edges.some(e => e.type === "conditional" || e.condition) };
  }).filter(Boolean);
}

export function pairRequestResponses(graph) {
  const pairs = [];
  const requests = graph.edges.filter(e => ["request", "read", "write"].includes(e.type));
  const responses = graph.edges.filter(e => ["response", "return"].includes(e.type));
  for (const request of requests) {
    const response = responses.find(r => r.from === request.to && r.to === request.from);
    if (response) pairs.push({ request: request.id, response: response.id });
  }
  return pairs;
}

export function findRootsAndLeaves(graph) {
  const relevant = graph.edges.filter(e => !BACK_EDGE_TYPES.has(e.type) && !PASSIVE_EDGE_TYPES.has(e.type));
  const incoming = new Map(graph.nodes.map(n => [n.id, 0])), outgoing = new Map(graph.nodes.map(n => [n.id, 0]));
  for (const edge of relevant) { incoming.set(edge.to, incoming.get(edge.to) + 1); outgoing.set(edge.from, outgoing.get(edge.from) + 1); }
  return {
    roots: graph.nodes.filter(n => incoming.get(n.id) === 0).map(n => n.id),
    leaves: graph.nodes.filter(n => outgoing.get(n.id) === 0).map(n => n.id)
  };
}

export function findUnreachable(graph) {
  if (!graph.nodes.length) return [];
  const { roots } = findRootsAndLeaves(graph), start = roots.length ? roots : [graph.nodes[0].id];
  const { outgoing } = buildAdjacency(graph), seen = new Set(start), queue = [...start];
  while (queue.length) {
    const id = queue.shift();
    for (const edge of outgoing.get(id) || []) if (!seen.has(edge.to)) { seen.add(edge.to); queue.push(edge.to); }
  }
  return graph.nodes.filter(n => !seen.has(n.id)).map(n => n.id);
}

export function analyzeGraph(input) {
  const graph = normalizeGraph(input), levels = computeForwardLevels(graph);
  const { roots, leaves } = findRootsAndLeaves(graph);
  return {
    graph, roots, leaves,
    cycles: detectCycles(graph),
    branches: detectBranches(graph),
    requestResponsePairs: pairRequestResponses(graph),
    unreachable: findUnreachable(graph),
    levels: Object.fromEntries(levels)
  };
}

export function isFlowEdge(edge) { return FLOW_EDGE_TYPES.has(edge.type) && !PASSIVE_EDGE_TYPES.has(edge.type); }
export function isBackEdge(edge) { return BACK_EDGE_TYPES.has(edge.type); }

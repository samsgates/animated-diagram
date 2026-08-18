import { analyzeGraph, isBackEdge } from "@animted-diagram/graph";

export const PRESETS = Object.freeze({
  subtle: { speed: .8, duration: 1500, gap: 10, dotSize: 1.6, easing: "linear", nodePulse: false, connectorOpacity: .75 },
  normal: { speed: 1, duration: 1200, gap: 8, dotSize: 2, easing: "linear", nodePulse: true, connectorOpacity: .9 },
  technical: { speed: 1, duration: 1100, gap: 7, dotSize: 1.8, easing: "linear", nodePulse: false, connectorOpacity: 1 },
  presentation: { speed: .9, duration: 1350, gap: 8, dotSize: 2.4, easing: "ease-in-out", nodePulse: true, connectorOpacity: 1 },
  educational: { speed: .75, duration: 1600, gap: 9, dotSize: 2.2, easing: "ease-in-out", nodePulse: true, connectorOpacity: 1 },
  cinematic: { speed: .65, duration: 1900, gap: 12, dotSize: 2.8, easing: "ease-in-out", nodePulse: true, connectorOpacity: 1 },
  fast: { speed: 1.5, duration: 700, gap: 6, dotSize: 1.8, easing: "linear", nodePulse: false, connectorOpacity: 1 },
  none: { speed: 1, duration: 0, gap: 8, dotSize: 0, easing: "linear", nodePulse: false, connectorOpacity: 0 }
});

const EDGE_STYLE = Object.freeze({
  request: "dots", response: "dots", data: "dash", control: "draw", event: "pulse",
  async: "dots", dependency: "none", feedback: "dots", retry: "trail", return: "dots",
  success: "dots", failure: "pulse", conditional: "draw", stream: "dots", replication: "dots",
  publish: "dots", subscribe: "dots", read: "dash", write: "dash", trigger: "pulse", handoff: "dots"
});
const CONTINUOUS = new Set(["stream", "feedback", "replication"]);
const TYPE_BEHAVIOR = Object.freeze({
  architecture: "flow", flowchart: "branch", sequence: "chronological", "state-machine": "transition",
  er: "static", timeline: "reveal", swimlane: "handoff", quadrant: "reveal", nested: "reveal",
  tree: "reveal", "org-chart": "reveal", venn: "reveal", "layer-stack": "reveal",
  pyramid: "progression", "consultant-2x2": "reveal", radar: "chart", loop: "cycle",
  "it-current-state": "flow", "high-level": "flow", "bar-chart": "chart", "line-chart": "chart",
  gantt: "progress", "scatter-plot": "chart", process: "flow", medallion: "flow",
  "data-flow": "flow", "dp-integration": "flow", "dp-security-matrix": "evaluation"
});

function mergeConfig(graph, options = {}) {
  const presetName = options.preset || graph.config?.preset || "technical";
  const preset = PRESETS[presetName] || PRESETS.technical;
  return {
    mode: options.mode || graph.config?.mode || "auto",
    preset: presetName,
    animation: { ...preset, style: "dots", ...(graph.config?.animation || {}), ...(options.animation || {}) },
    sequence: { strategy: "auto", parallel: true, delay: 260, hold: 820, ...(graph.config?.sequence || {}), ...(options.sequence || {}) },
    loop: { enabled: "auto", pause: 500, iterations: "infinite", ...(graph.config?.loop || {}), ...(options.loop || {}) },
    branch: { strategy: options.branchStrategy || graph.config?.branch?.strategy || "branch-all", ...(graph.config?.branch || {}) },
    scenario: options.scenario || graph.config?.scenario,
    maxSteps: Number(options.maxSteps || graph.config?.maxSteps || 64)
  };
}

function filterScenario(graph, scenarioName) {
  if (!scenarioName) return graph.edges;
  const scenario = graph.scenarios?.[scenarioName];
  if (!scenario) throw new Error(`Unknown scenario "${scenarioName}".`);
  const allowed = new Set(scenario.edges || []);
  return graph.edges.filter(edge => allowed.has(edge.id));
}

function applyBranchStrategy(edges, analysis, config) {
  const strategy = config.branch.strategy;
  if (strategy === "branch-all" || strategy === "interactive") return edges;
  const chosen = new Set(edges.map(e => e.id));
  for (const branch of analysis.branches) {
    const branchEdges = edges.filter(e => branch.edges.includes(e.id));
    if (branchEdges.length < 2) continue;
    let keep;
    if (strategy === "branch-success") {
      keep = branchEdges.find(e => e.type === "success" || /yes|success|valid|true/i.test(e.condition || e.label || "")) || branchEdges[0];
    } else if (strategy === "branch-failure") {
      keep = branchEdges.find(e => e.type === "failure" || /no|fail|invalid|false|error/i.test(e.condition || e.label || "")) || branchEdges.at(-1);
    }
    if (keep) for (const edge of branchEdges) if (edge.id !== keep.id) chosen.delete(edge.id);
  }
  return edges.filter(e => chosen.has(e.id));
}

function explicitOrderPlan(edges) {
  const groups = new Map();
  for (const edge of edges) {
    const key = Number(edge.order);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(edge);
  }
  return [...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([,g])=>g.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id)));
}

function autoOrderPlan(edges, analysis, parallel) {
  const level = analysis.levels;
  const forward = edges.filter(e => !isBackEdge(e) && e.type !== "dependency");
  const back = edges.filter(e => isBackEdge(e));
  const passive = edges.filter(e => e.type === "dependency");
  const groups = [];
  if (parallel) {
    const byLevel = new Map();
    for (const edge of forward) {
      const key = Number(level[edge.from] ?? 0);
      if (!byLevel.has(key)) byLevel.set(key, []);
      byLevel.get(key).push(edge);
    }
    for (const key of [...byLevel.keys()].sort((a,b)=>a-b)) {
      const bySource = new Map();
      for (const edge of byLevel.get(key)) {
        if (!bySource.has(edge.from)) bySource.set(edge.from, []);
        bySource.get(edge.from).push(edge);
      }
      for (const source of [...bySource.keys()].sort()) groups.push(bySource.get(source).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id)));
    }
  } else {
    forward.sort((a,b)=>(level[a.from]??0)-(level[b.from]??0)||a.priority-b.priority||a.id.localeCompare(b.id)).forEach(e=>groups.push([e]));
  }
  back.sort((a,b)=>(level[b.from]??0)-(level[a.from]??0)||a.priority-b.priority||a.id.localeCompare(b.id)).forEach(e=>groups.push([e]));
  if (passive.length) groups.push(passive);
  return groups;
}

function edgeAnimation(edge, config) {
  const override = edge.animation || {};
  const style = override.style || EDGE_STYLE[edge.type] || config.animation.style || "dots";
  return {
    style,
    reverse: Boolean(edge.reverse || override.reverse),
    speed: Number(override.speed ?? config.animation.speed),
    duration: Number(override.duration ?? config.animation.duration),
    gap: Number(override.gap ?? config.animation.gap),
    dotSize: Number(override.dotSize ?? config.animation.dotSize),
    easing: override.easing || config.animation.easing,
    continuous: override.continuous ?? CONTINUOUS.has(edge.type),
    iterations: override.iterations ?? (CONTINUOUS.has(edge.type) ? config.loop.iterations : 1)
  };
}

export function planAnimation(input, options = {}) {
  const analysis = analyzeGraph(input), graph = analysis.graph, config = mergeConfig(graph, options);
  let edges = applyBranchStrategy(filterScenario(graph, config.scenario), analysis, config);
  const hasExplicitOrder = edges.length > 0 && edges.every(edge => Number.isFinite(edge.order));
  const groups = hasExplicitOrder ? explicitOrderPlan(edges) : autoOrderPlan(edges, analysis, config.sequence.parallel);
  if (groups.length > config.maxSteps) throw new Error(`Animation requires ${groups.length} steps, exceeding maxSteps=${config.maxSteps}.`);

  const steps = groups.map((group, index) => {
    const step = index + 1, actions = [], nodes = new Set();
    for (const edge of group) {
      nodes.add(edge.from); nodes.add(edge.to);
      actions.push({
        kind: edge.type === "dependency" ? "highlight-edge" : "flow-edge",
        edgeId: edge.id, from: edge.from, to: edge.to, edgeType: edge.type,
        animation: edgeAnimation(edge, config)
      });
    }
    return {
      step,
      label: group.map(edge => edge.label || `${edge.from} → ${edge.to}`).join(" + "),
      edges: group.map(edge => edge.id),
      nodes: [...nodes],
      actions,
      delay: config.sequence.delay,
      hold: config.sequence.hold
    };
  });

  const loopEdges = edges.filter(edge => edgeAnimation(edge, config).continuous).map(edge => ({edgeId: edge.id, animation: edgeAnimation(edge, config)}));
  const nodeFirstStep = {};
  for (const step of steps) for (const node of step.nodes) if (!(node in nodeFirstStep)) nodeFirstStep[node] = step.step;

  return {
    version: 1, diagramId: graph.id, diagramType: graph.type,
    behavior: TYPE_BEHAVIOR[graph.type] || "flow", config,
    stepCount: steps.length, steps, loops: loopEdges, nodeFirstStep,
    roots: analysis.roots, leaves: analysis.leaves, cycles: analysis.cycles,
    branches: analysis.branches, requestResponsePairs: analysis.requestResponsePairs,
    unreachable: analysis.unreachable, scenario: config.scenario || null
  };
}

export function explainPlan(input, options = {}) {
  const plan = planAnimation(input, options);
  const lines = [
    `Diagram: ${plan.diagramId}`, `Type: ${plan.diagramType}`, `Behavior: ${plan.behavior}`,
    `Roots: ${plan.roots.length ? plan.roots.join(", ") : "(cycle / none)"}`,
    `Leaves: ${plan.leaves.length ? plan.leaves.join(", ") : "(cycle / none)"}`,
    `Steps: ${plan.stepCount}`
  ];
  if (plan.scenario) lines.push(`Scenario: ${plan.scenario}`);
  if (plan.cycles.length) lines.push(`Cycles: ${plan.cycles.map(c=>`[${c.nodes.join(" → ")}]`).join(", ")}`);
  if (plan.branches.length) lines.push(`Branches: ${plan.branches.map(b=>`${b.node}(${b.edges.join(",")})`).join("; ")}`);
  if (plan.requestResponsePairs.length) lines.push(`Request/response pairs: ${plan.requestResponsePairs.map(p=>`${p.request} ↔ ${p.response}`).join(", ")}`);
  if (plan.unreachable.length) lines.push(`Unreachable: ${plan.unreachable.join(", ")}`);
  lines.push("", "Timeline:");
  for (const step of plan.steps) lines.push(`  ${step.step}. ${step.label}`);
  if (plan.loops.length) lines.push("", `Continuous flows: ${plan.loops.map(l=>l.edgeId).join(", ")}`);
  return lines.join("\n");
}

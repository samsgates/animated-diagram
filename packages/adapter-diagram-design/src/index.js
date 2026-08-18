import { normalizeGraph } from "@animted-diagram/graph";
import { planAnimation } from "@animted-diagram/planner";
import { runtimeCSS, runtimeJS } from "@animted-diagram/runtime";

const esc = value => String(value ?? "").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const reEsc = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function addAttributesById(html, elementId, attributes) {
  const safe = reEsc(elementId);
  const pattern = new RegExp(`(<(?:path|line|polyline|g|rect|circle|polygon)\\b[^>]*\\bid=["']${safe}["'][^>]*)(>)`, "i");
  if (!pattern.test(html)) return { html, found: false };
  const attrs = Object.entries(attributes).map(([k,v]) => ` ${k}="${esc(v)}"`).join("");
  return { html: html.replace(pattern, `$1${attrs}$2`), found: true };
}

function buildPlanBundle(graph, options) {
  const defaultPlan = planAnimation(graph, options);
  const plans = { default: defaultPlan };
  for (const scenario of Object.keys(graph.scenarios || {})) {
    plans[scenario] = planAnimation(graph, {...options, scenario});
  }
  return { version:1, defaultScenario: options.scenario || (Object.keys(graph.scenarios || {})[0] || "default"), plans };
}

export function inferDiagramDesignBindings(html, input) {
  const graph = normalizeGraph(input);
  const bindings = { edges:{}, nodes:{} }, unresolved = { edges:[], nodes:[] };
  for (const edge of graph.edges) {
    const candidates = [
      edge.metadata?.pathId,
      edge.id,
      `ad-path-${edge.id}`
    ].filter(Boolean);
    let found = null;
    for (const id of candidates) {
      const rx = new RegExp(`\\bid=["']${reEsc(id)}["']`);
      if (rx.test(html)) { found = id; break; }
    }
    if (found) bindings.edges[edge.id] = { pathId:found };
    else unresolved.edges.push(edge.id);
  }
  for (const node of graph.nodes) {
    const candidates = [node.metadata?.elementId,node.id,`node-${node.id}`].filter(Boolean);
    let found = null;
    for (const id of candidates) {
      if (new RegExp(`\\bid=["']${reEsc(id)}["']`).test(html)) { found=id; break; }
    }
    if (found) bindings.nodes[node.id] = { elementId:found };
    else unresolved.nodes.push(node.id);
  }
  return { bindings, unresolved };
}

function adapterControls(graph, bundle) {
  const scenarios = Object.keys(bundle.plans).filter(x=>x!=="default");
  const select = scenarios.length
    ? `<label>Scenario <select data-ad-scenario-select>${scenarios.map(s=>`<option value="${esc(s)}">${esc(graph.scenarios[s]?.label||s)}</option>`).join("")}</select></label>`
    : "";
  return `<div class="ad-controls" aria-label="Animation controls">
    <button type="button" data-ad-action="prev">Previous</button>
    <button type="button" data-ad-action="play" aria-pressed="false">Play</button>
    <button type="button" data-ad-action="next">Next</button>
    <button type="button" data-ad-action="replay">Replay</button>
    <span class="ad-step-readout" data-ad-readout>Step 0</span>
    <label>Speed <select data-ad-speed><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
    ${select}
  </div>
  <p class="ad-help">Keyboard: ←/→ steps, Home/End, Space play/pause, R replay.</p>
  <span class="ad-status" data-ad-status role="status" aria-live="polite" aria-atomic="true"></span>`;
}

export function decorateDiagramDesignHtml(sourceHtml, input, bindings = {}, options = {}) {
  if (typeof sourceHtml !== "string" || !/<svg\b/i.test(sourceHtml)) {
    throw new Error("diagram-design adapter requires an HTML document containing inline SVG.");
  }
  const graph = normalizeGraph(input);
  const bundle = buildPlanBundle(graph, options);
  const activePlan = bundle.plans[bundle.defaultScenario] || bundle.plans.default;
  const edgeBindings = bindings.edges || {};
  const nodeBindings = bindings.nodes || {};
  let html = sourceHtml, overlay = [], unresolved = [];

  for (const edge of graph.edges) {
    const binding = edgeBindings[edge.id];
    if (!binding?.pathId) { unresolved.push(edge.id); continue; }
    const step = activePlan.steps.find(s=>s.edges.includes(edge.id))?.step || 0;
    const action = activePlan.steps.flatMap(s=>s.actions).find(a=>a.edgeId===edge.id);
    const anim = action?.animation || {style:"dots",duration:1100,gap:8,dotSize:2,reverse:false,continuous:false};
    const result = addAttributesById(html,binding.pathId,{
      "data-base-edge":"",
      "data-edge-id":edge.id,
      "data-source":edge.from,
      "data-target":edge.to,
      "data-edge-type":edge.type
    });
    html = result.html;
    if (!result.found) { unresolved.push(edge.id); continue; }
    const reverse = binding.reverse ?? anim.reverse;
    overlay.push(`<use href="#${esc(binding.pathId)}" class="ad-flow" data-ad-flow data-edge-id="${esc(edge.id)}" data-source="${esc(edge.from)}" data-target="${esc(edge.to)}" data-edge-type="${esc(edge.type)}" data-ad-step="${step}" data-ad-loop="${anim.continuous?"true":"false"}" data-ad-style="${esc(anim.style)}" data-ad-reverse="${reverse?"true":"false"}" style="--ad-duration:${Math.max(1,anim.duration)}ms;--ad-gap:${Math.max(1,anim.gap)};--ad-dot:${Math.max(.5,anim.dotSize)}" aria-hidden="true" focusable="false"/>`);
  }

  for (const node of graph.nodes) {
    const binding = nodeBindings[node.id];
    if (!binding?.elementId) continue;
    const result = addAttributesById(html,binding.elementId,{
      "data-diagram-node":node.id,
      "data-node-type":node.type,
      "data-ad-interactive":"true",
      "tabindex":"0",
      "role":"button"
    });
    html = result.html;
  }

  if (options.strict !== false && unresolved.length) {
    throw new Error(`Unresolved diagram-design edge bindings: ${unresolved.join(", ")}`);
  }

  html = html.replace(/<\/svg>/i, `${overlay.join("\n")}\n</svg>`);
  html = html.replace(/<\/head>/i, `<style data-animted-diagram>${runtimeCSS}</style>\n</head>`);
  html = html.replace(/<body([^>]*)>/i, `<body$1 data-ad-root data-ad-theme="${esc(graph.theme)}" data-ad-state="paused" data-ad-frame="static" data-ad-step="0" data-ad-step-count="${activePlan.stepCount}" data-ad-scenario="${esc(bundle.defaultScenario)}">`);
  const planJson = JSON.stringify(bundle).replaceAll("<","\\u003c");
  html = html.replace(/<\/body>/i, `${adapterControls(graph,bundle)}<script type="application/json" data-ad-plan>${planJson}</script><script>${runtimeJS}</script></body>`);
  return { html, unresolved, planBundle:bundle };
}

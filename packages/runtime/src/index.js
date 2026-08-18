export const runtimeCSS = String.raw`
:root {
  --ad-paper: #f7f7f5;
  --ad-ink: #171717;
  --ad-muted: #697386;
  --ad-accent: #eb6c36;
  --ad-line: #c9c9c5;
  --ad-card: #ffffff;
  --ad-focus: #2563eb;
}
[data-ad-theme="dark"] {
  --ad-paper: #121212;
  --ad-ink: #f2f2ef;
  --ad-muted: #a6adbb;
  --ad-line: #4a4a47;
  --ad-card: #1d1d1d;
}
.ad-shell {
  background: var(--ad-paper);
  color: var(--ad-ink);
  border: 1px solid var(--ad-line);
  border-radius: 18px;
  overflow: hidden;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.ad-canvas { overflow-x: auto; padding: 14px; }
.ad-svg { display: block; width: 100%; min-width: 720px; height: auto; }
.ad-node-shape { fill: var(--ad-card); stroke: var(--ad-line); stroke-width: 1.5; }
.ad-node-title { fill: var(--ad-ink); font-size: 14px; font-weight: 650; }
.ad-node-sub { fill: var(--ad-muted); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.ad-node { cursor: default; outline: none; }
.ad-node[data-ad-interactive="true"] { cursor: pointer; }
.ad-node.is-active .ad-node-shape { stroke: var(--ad-accent); stroke-width: 2.5; }
.ad-node.is-focus .ad-node-shape { stroke: var(--ad-focus); stroke-width: 2.5; }
.ad-base-edge { fill: none; stroke: var(--ad-line); stroke-width: 1.5; }
.ad-base-edge[data-edge-type="dependency"] { stroke-dasharray: 4 5; }
.ad-edge-label { fill: var(--ad-muted); font-size: 10px; paint-order: stroke; stroke: var(--ad-paper); stroke-width: 4px; }
.ad-flow {
  fill: none;
  stroke: var(--ad-accent);
  stroke-width: 2.4;
  opacity: 0;
  pointer-events: none;
  animation-play-state: paused;
  vector-effect: non-scaling-stroke;
}
.ad-flow.is-active, .ad-flow.is-loop {
  opacity: 1;
  animation-play-state: running;
}
.ad-flow[data-ad-style="dots"] {
  stroke-linecap: round;
  stroke-dasharray: var(--ad-dot, 2) var(--ad-gap, 8);
  animation-name: ad-flow-shift;
  animation-duration: var(--ad-duration, 1100ms);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.ad-flow[data-ad-style="dash"] {
  stroke-dasharray: 9 var(--ad-gap, 8);
  animation: ad-flow-shift var(--ad-duration, 1100ms) linear infinite paused;
}
.ad-flow[data-ad-style="trail"] {
  stroke-dasharray: 24 40;
  animation: ad-flow-shift var(--ad-duration, 1300ms) linear infinite paused;
}
.ad-flow[data-ad-style="token"] {
  stroke-linecap: round;
  stroke-width: 6;
  stroke-dasharray: 1 99;
  animation: ad-flow-shift var(--ad-duration, 1300ms) linear infinite paused;
}
.ad-flow[data-ad-style="fade"] {
  stroke-width: 3;
  animation: ad-edge-fade var(--ad-duration, 1100ms) ease-in-out infinite paused;
}
.ad-flow[data-ad-style="pulse"] {
  stroke-dasharray: 3 18;
  stroke-width: 4;
  animation: ad-flow-shift var(--ad-duration, 900ms) ease-in-out infinite paused;
}
.ad-flow[data-ad-style="draw"] {
  path-length: 1;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ad-path-draw var(--ad-duration, 1100ms) ease-in-out forwards paused;
}
.ad-flow[data-ad-style="none"] { display: none; }
.ad-flow[data-ad-reverse="true"] { animation-direction: reverse !important; }
.ad-flow.is-active[data-ad-style="dash"],
.ad-flow.is-active[data-ad-style="trail"],
.ad-flow.is-active[data-ad-style="token"],
.ad-flow.is-active[data-ad-style="fade"],
.ad-flow.is-active[data-ad-style="pulse"],
.ad-flow.is-active[data-ad-style="draw"],
.ad-flow.is-loop[data-ad-style="dash"],
.ad-flow.is-loop[data-ad-style="trail"],
.ad-flow.is-loop[data-ad-style="token"],
.ad-flow.is-loop[data-ad-style="fade"],
.ad-flow.is-loop[data-ad-style="pulse"] { animation-play-state: running; }

@keyframes ad-flow-shift { to { stroke-dashoffset: -32; } }
@keyframes ad-edge-fade { 0%,100% { opacity:.25; } 50% { opacity:1; } }
@keyframes ad-path-draw { to { stroke-dashoffset: 0; } }

.ad-chart-mark { opacity: .28; transition: opacity 220ms ease, transform 220ms ease; transform-origin: center; }
.ad-chart-mark.is-visible, [data-ad-frame="end"] .ad-chart-mark, [data-ad-frame="static"] .ad-chart-mark { opacity: 1; transform: none; }
.ad-dim { opacity: .18 !important; }
.ad-focus-edge { stroke: var(--ad-focus) !important; opacity: 1 !important; }

.ad-controls {
  border-top: 1px solid var(--ad-line);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--ad-paper) 92%, var(--ad-card));
}
.ad-controls button, .ad-controls select, .ad-controls label {
  min-height: 44px;
  font: inherit;
}
.ad-controls label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.ad-controls input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--ad-accent);
}
.ad-controls button, .ad-controls select {
  border: 1px solid var(--ad-line);
  border-radius: 10px;
  background: var(--ad-card);
  color: var(--ad-ink);
  padding: 0 13px;
}
.ad-controls button { cursor: pointer; font-weight: 620; }
.ad-controls button:hover:not(:disabled) { border-color: var(--ad-accent); }
.ad-controls button:focus-visible, .ad-controls select:focus-visible, .ad-node:focus-visible .ad-node-shape {
  outline: 3px solid color-mix(in srgb, var(--ad-focus) 35%, transparent);
  outline-offset: 2px;
}
.ad-controls button:disabled { opacity: .42; cursor: not-allowed; }
.ad-step-readout { color: var(--ad-muted); min-width: 90px; font-size: 13px; }
.ad-status { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.ad-groups { display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 8px 14px 12px; border-top: 1px solid var(--ad-line); font-size: 13px; }
.ad-groups label { display: inline-flex; align-items: center; gap: 6px; }
.ad-help { padding: 0 14px 12px; margin: 0; color: var(--ad-muted); font-size: 12px; }

@media (prefers-reduced-motion: reduce) {
  .ad-flow { display: none !important; animation: none !important; }
  .ad-chart-mark { opacity: 1 !important; transform: none !important; transition: none !important; }
  .ad-controls { display: none !important; }
}
@media print {
  .ad-flow, .ad-controls, .ad-groups, .ad-help { display: none !important; }
  .ad-chart-mark { opacity: 1 !important; transform: none !important; }
  .ad-shell { border: 0; }
}
`;

function runtimeFactory() {
  const roots = document.querySelectorAll("[data-ad-root]");
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticQuery = new URLSearchParams(location.search).get("motion") === "static";

  const parsePlan = root => {
    const node = root.querySelector('script[type="application/json"][data-ad-plan]');
    if (!node) return { stepCount: Number(root.dataset.adStepCount || 0), steps: [] };
    try { return JSON.parse(node.textContent); } catch { return { stepCount: 0, steps: [] }; }
  };

  const init = root => {
    let planBundle = parsePlan(root);
    let scenario = root.dataset.adScenario || planBundle.defaultScenario || "default";
    let plan = planBundle.plans ? (planBundle.plans[scenario] || planBundle.plans.default) : planBundle;
    let step = 0;
    let playing = false;
    let timer = null;
    let speed = 1;
    let focusedNode = null;

    const status = root.querySelector("[data-ad-status]");
    const readout = root.querySelector("[data-ad-readout]");
    const controls = [...root.querySelectorAll("[data-ad-action]")];
    const scenarioSelect = root.querySelector("[data-ad-scenario-select]");
    const speedSelect = root.querySelector("[data-ad-speed]");
    const loopToggle = root.querySelector("[data-ad-loop-toggle], [data-ad-loop-control]");
    let loopMode = loopToggle ? (loopToggle.type === "checkbox" ? loopToggle.checked : true) : true;
    const edges = () => [...root.querySelectorAll("[data-ad-flow]")];
    const nodes = () => [...root.querySelectorAll("[data-diagram-node]")];
    const marks = () => [...root.querySelectorAll("[data-ad-item-id]")];

    const stopTimer = () => { if (timer) clearTimeout(timer); timer = null; };

    const applyPlanSteps = () => {
      for (const edge of edges()) {
        const id = edge.dataset.edgeId;
        let edgeStep = 0;
        for (const item of plan.steps || []) if ((item.edges || []).includes(id)) { edgeStep = item.step; break; }
        edge.dataset.adStep = String(edgeStep || 0);
      }
      for (const mark of marks()) {
        const id = mark.dataset.adItemId;
        let markStep = 0;
        for (const item of plan.steps || []) {
          if ((item.actions || []).some(a => a.itemId === id)) { markStep = item.step; break; }
        }
        mark.dataset.adItemStep = String(markStep || 0);
      }
      root.dataset.adStepCount = String(plan.stepCount || 0);
    };

    const announce = text => { if (status) status.textContent = text; };

    const render = (announceChange = false) => {
      const max = Number(plan.stepCount || 0);
      root.dataset.adStep = String(step);
      root.dataset.adState = reduced ? "reduced" : (playing ? "playing" : "paused");
      root.dataset.adFrame = step >= max && max > 0 ? "end" : (staticQuery || reduced ? "static" : "interactive");

      for (const edge of edges()) {
        const edgeStep = Number(edge.dataset.adStep || 0);
        const loop = edge.dataset.adLoop === "true";
        edge.classList.toggle("is-active", !reduced && !staticQuery && edgeStep === step && edgeStep > 0);
        edge.classList.toggle("is-loop", !reduced && !staticQuery && loop && step >= edgeStep && edgeStep > 0);
      }

      for (const node of nodes()) {
        const nodeId = node.dataset.diagramNode;
        const current = (plan.steps || []).find(s => s.step === step);
        node.classList.toggle("is-active", Boolean(current?.nodes?.includes(nodeId)));
      }

      for (const mark of marks()) {
        const markStep = Number(mark.dataset.adItemStep || 0);
        mark.classList.toggle("is-visible", staticQuery || reduced || step >= markStep);
      }

      if (readout) readout.textContent = max ? `Step ${Math.min(step, max)} / ${max}` : "Static";
      if (loopToggle && loopToggle.type === "checkbox") loopToggle.disabled = max === 0 || reduced || staticQuery;
      for (const button of controls) {
        const action = button.dataset.adAction;
        if (action === "prev") button.disabled = step <= 0 || reduced || staticQuery;
        if (action === "next") button.disabled = step >= max || reduced || staticQuery;
        if (action === "play") {
          button.disabled = max === 0 || reduced || staticQuery;
          button.setAttribute("aria-pressed", String(playing));
          button.textContent = playing ? "Pause" : "Play";
        }
        if (action === "loop") {
          button.disabled = max === 0 || reduced || staticQuery;
          button.setAttribute("aria-pressed", String(loopMode));
          button.classList.toggle("is-active", loopMode);
        }
      }
      if (announceChange) {
        const current = (plan.steps || []).find(s => s.step === step);
        announce(current ? `Step ${step} of ${max}: ${current.label}` : (step === 0 ? "Animation reset." : "Animation complete."));
      }
    };

    const schedule = () => {
      stopTimer();
      if (!playing) return;
      const max = Number(plan.stepCount || 0);
      if (step >= max) {
        if (loopMode && max > 0) {
          const pauseDelay = Number(plan.config?.loop?.pause ?? 800) / speed;
          timer = setTimeout(() => {
            if (!playing) return;
            step = 1;
            render(false);
            schedule();
          }, Math.max(80, pauseDelay));
          return;
        }
        playing = false;
        render(false);
        announce("Animation complete.");
        return;
      }
      const current = (plan.steps || []).find(s => s.step === step);
      const hold = Number(current?.hold || plan.config?.sequence?.hold || 820) / speed;
      timer = setTimeout(() => {
        step = Math.min(max, step + 1);
        render(false);
        schedule();
      }, Math.max(80, hold));
    };

    const play = () => {
      if (reduced || staticQuery || Number(plan.stepCount || 0) === 0) return;
      if (playing) { playing = false; stopTimer(); render(true); announce("Animation paused."); return; }
      if (step >= Number(plan.stepCount || 0)) step = 0;
      if (step === 0) step = 1;
      playing = true; render(true); schedule();
    };
    const pause = () => { playing = false; stopTimer(); render(false); };
    const replay = () => { pause(); step = 0; render(false); play(); announce("Animation replayed."); };
    const next = () => { pause(); step = Math.min(Number(plan.stepCount || 0), step + 1); render(true); };
    const prev = () => { pause(); step = Math.max(0, step - 1); render(true); };
    const toggleLoop = nextVal => {
      loopMode = typeof nextVal === "boolean" ? nextVal : !loopMode;
      if (loopToggle && loopToggle.type === "checkbox") loopToggle.checked = loopMode;
      for (const btn of root.querySelectorAll('[data-ad-action="loop"]')) {
        btn.setAttribute("aria-pressed", String(loopMode));
        btn.classList.toggle("is-active", loopMode);
      }
      announce(loopMode ? "Loop mode enabled." : "Loop mode disabled (play once).");
    };

    root.addEventListener("click", event => {
      const button = event.target.closest("[data-ad-action]");
      if (button) {
        const action = button.dataset.adAction;
        if (action === "play") play();
        if (action === "replay") replay();
        if (action === "next") next();
        if (action === "prev") prev();
        if (action === "loop") toggleLoop();
        if (action === "end") { pause(); step = Number(plan.stepCount || 0); render(true); }
        return;
      }
      const node = event.target.closest("[data-diagram-node]");
      if (node && root.contains(node)) focusNode(node.dataset.diagramNode);
    });

    const focusNode = id => {
      focusedNode = focusedNode === id ? null : id;
      for (const node of nodes()) node.classList.toggle("is-focus", node.dataset.diagramNode === focusedNode);
      const baseEdges = [...root.querySelectorAll("[data-base-edge]")];
      for (const edge of baseEdges) {
        const connected = edge.dataset.source === focusedNode || edge.dataset.target === focusedNode;
        edge.classList.toggle("ad-focus-edge", Boolean(focusedNode && connected));
        edge.classList.toggle("ad-dim", Boolean(focusedNode && !connected));
      }
      announce(focusedNode ? `Focused node ${id}. Connected relationships highlighted.` : "Node focus cleared.");
    };

    root.addEventListener("keydown", event => {
      const tag = event.target?.tagName?.toLowerCase();
      if (["input", "select", "textarea", "a", "button"].includes(tag)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); prev(); }
      if (event.key === "Home") { event.preventDefault(); pause(); step = 0; render(true); }
      if (event.key === "End") { event.preventDefault(); pause(); step = Number(plan.stepCount || 0); render(true); }
      if (event.key === " " && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); play(); }
      if ((event.key === "r" || event.key === "R") && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); replay(); }
      if ((event.key === "l" || event.key === "L") && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); toggleLoop(); }
      if (event.key === "Enter") {
        const node = event.target.closest?.("[data-diagram-node]");
        if (node) focusNode(node.dataset.diagramNode);
      }
    });

    scenarioSelect?.addEventListener("change", () => {
      pause();
      scenario = scenarioSelect.value;
      plan = planBundle.plans?.[scenario] || planBundle.plans?.default || planBundle;
      step = 0;
      root.dataset.adScenario = scenario;
      applyPlanSteps();
      render(true);
      announce(`Scenario changed to ${scenario}.`);
    });

    speedSelect?.addEventListener("change", () => {
      const nextSpeed = Number(speedSelect.value);
      speed = Number.isFinite(nextSpeed) && nextSpeed > 0 ? nextSpeed : 1;
      if (playing) schedule();
      announce(`Playback speed ${speed}x.`);
    });

    loopToggle?.addEventListener("change", () => {
      toggleLoop(Boolean(loopToggle.checked));
    });

    for (const toggle of root.querySelectorAll("[data-ad-group-toggle]")) {
      toggle.addEventListener("change", () => {
        const group = toggle.dataset.adGroupToggle;
        for (const element of root.querySelectorAll(`[data-edge-group="${CSS.escape(group)}"]`)) {
          element.style.display = toggle.checked ? "" : "none";
        }
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && playing) {
        pause();
        announce("Animation paused because the page is hidden.");
      }
    });

    applyPlanSteps();
    if (reduced || staticQuery) {
      step = Number(plan.stepCount || 0);
      root.dataset.adState = reduced ? "reduced" : "static";
      root.dataset.adFrame = "static";
      const c = root.querySelector(".ad-controls"); if (c) c.hidden = true;
      announce(reduced ? "Animation unavailable because reduced motion is enabled." : "Static diagram.");
    }
    render(false);
  };

  roots.forEach(init);
}

export function initAnimatedDiagrams() {
  runtimeFactory();
}

export const runtimeJS = `(${runtimeFactory.toString()})();`;

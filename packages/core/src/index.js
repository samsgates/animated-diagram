import { normalizeGraph, analyzeGraph } from "@animted-diagram/graph";
import { planAnimation, explainPlan } from "@animted-diagram/planner";
import { renderHtmlDocument } from "@animted-diagram/svg";
import { applyGraphPlugins, applyPlanPlugins, applyHtmlPlugins } from "@animted-diagram/plugins";

function nonFlowItems(graph) {
  if (graph.type === "bar-chart") return (graph.data.items || []).map((x,i)=>({id:String(x.id||`bar-${i+1}`),label:String(x.label||x.id||`Bar ${i+1}`)}));
  if (graph.type === "line-chart") {
    const points=(graph.data.points||[]).map((x,i)=>({id:String(x.id||`point-${i+1}`),label:String(x.label||x.id||`Point ${i+1}`)}));
    return [{id:"series",label:"Line series"},...points];
  }
  if (graph.type === "scatter-plot") return (graph.data.points||[]).map((x,i)=>({id:String(x.id||`point-${i+1}`),label:String(x.label||x.id||`Point ${i+1}`)}));
  if (graph.type === "gantt") return (graph.data.tasks||[]).map((x,i)=>({id:String(x.id||`task-${i+1}`),label:String(x.label||x.id||`Task ${i+1}`)}));
  if (graph.type === "dp-security-matrix") {
    const rows=graph.data.rows||[], cols=graph.data.columns||[], items=[];
    rows.forEach((r,ri)=>cols.forEach((c,ci)=>items.push({id:`cell-${ri}-${ci}`,label:`${r} / ${c}`})));
    return items;
  }
  if (graph.type === "radar") return [{id:"radar-series",label:"Radar values"}];
  return graph.nodes.map(n=>({id:n.id,label:n.label,nodeId:n.id}));
}

function augmentNonFlowPlan(graph, plan) {
  if (plan.stepCount > 0) return plan;
  const items=nonFlowItems(graph);
  if (!items.length) return plan;
  const steps=items.map((item,i)=>({
    step:i+1,label:item.label,edges:[],nodes:item.nodeId?[item.nodeId]:[],
    actions:[{kind:"reveal-item",itemId:item.id}],delay:plan.config.sequence.delay,hold:plan.config.sequence.hold
  }));
  return {...plan,stepCount:steps.length,steps,nodeFirstStep:Object.fromEntries(items.filter(i=>i.nodeId).map((i,idx)=>[i.nodeId,idx+1]))};
}

export function buildPlanBundle(input, options={}) {
  const graph=normalizeGraph(input);
  const defaultScenario=options.scenario || (Object.keys(graph.scenarios||{})[0] || "default");
  const plans={};
  plans.default=augmentNonFlowPlan(graph,planAnimation(graph,{...options,scenario:undefined}));
  for(const name of Object.keys(graph.scenarios||{})) plans[name]=augmentNonFlowPlan(graph,planAnimation(graph,{...options,scenario:name}));
  if (defaultScenario !== "default" && !plans[defaultScenario]) throw new Error(`Unknown scenario "${defaultScenario}".`);
  return {version:1,defaultScenario,plans};
}

export function buildDiagram(input, options={}) {
  const plugins=Array.isArray(options.plugins)?options.plugins:[];
  let graph=normalizeGraph(input);
  graph=normalizeGraph(applyGraphPlugins(graph,plugins,{options}));
  let planBundle=buildPlanBundle(graph,options);
  planBundle=applyPlanPlugins(planBundle,plugins,{graph,options});
  let html=renderHtmlDocument(graph,planBundle,options);
  html=applyHtmlPlugins(html,plugins,{graph,planBundle,options});
  return {graph,planBundle,html};
}

export function analyzeDiagram(input) { return analyzeGraph(input); }
export function explainDiagram(input, options={}) { return explainPlan(input,options); }

export function validateSpecification(input) {
  const errors=[],warnings=[];
  let analysis;
  try { analysis=analyzeGraph(input); }
  catch(error) { return {valid:false,errors:[error.message],warnings:[]}; }
  if (!analysis.graph.nodes.length && !["bar-chart","line-chart","scatter-plot","gantt","dp-security-matrix","radar"].includes(analysis.graph.type)) warnings.push("Diagram has no semantic nodes.");
  if (analysis.unreachable.length) warnings.push(`Unreachable nodes: ${analysis.unreachable.join(", ")}`);
  if (analysis.graph.edges.some(e=>e.from===e.to && e.type!=="feedback" && e.type!=="retry")) warnings.push("Self-loop edge should normally use feedback or retry semantics.");
  for (const [name,scenario] of Object.entries(analysis.graph.scenarios||{})) {
    const known=new Set(analysis.graph.edges.map(e=>e.id));
    const missing=(scenario.edges||[]).filter(id=>!known.has(id));
    if(missing.length) errors.push(`Scenario "${name}" references unknown edges: ${missing.join(", ")}`);
  }
  return {valid:errors.length===0,errors,warnings,analysis};
}

export function validateHtml(html) {
  const errors=[],warnings=[];
  if(!/<!doctype html>/i.test(html)) warnings.push("Missing HTML doctype.");
  if(!/<svg\b/i.test(html)) errors.push("No inline SVG found.");
  if(!/\brole=["']img["']/i.test(html)) errors.push('SVG must expose role="img".');
  if(!/<title\b/i.test(html)) errors.push("SVG accessible title is missing.");
  if(!/<desc\b/i.test(html)) errors.push("SVG accessible description is missing.");
  if(/<script\b[^>]*\bsrc=/i.test(html)) errors.push("Remote/external scripts are not allowed in self-contained output.");
  if(/\bjavascript\s*:/i.test(html)) errors.push("javascript: URLs are not allowed.");
  if(/\beval\s*\(/i.test(html)) errors.push("eval() is not allowed.");
  if(/\bon\w+\s*=/i.test(html)) warnings.push("Executable HTML event attributes detected.");
  if(!/prefers-reduced-motion/i.test(html)) errors.push("Reduced-motion CSS is missing.");
  if(!/data-ad-plan/i.test(html)) warnings.push("No animation plan metadata found.");
  return {valid:errors.length===0,errors,warnings};
}

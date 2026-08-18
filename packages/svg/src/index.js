import { analyzeGraph } from "@animted-diagram/graph";
import { runtimeCSS, runtimeJS } from "@animted-diagram/runtime";

export function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export function domId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+/, "id-");
}
function n(value, fallback=0) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }

function layeredLayout(graph, width=1200, height=650) {
  const analysis = analyzeGraph(graph), levels = analysis.levels;
  const explicit = graph.nodes.every(node => node.position);
  if (explicit) return Object.fromEntries(graph.nodes.map(node => [node.id, node.position]));

  const maxLevel = Math.max(0, ...Object.values(levels));
  const byLevel = new Map();
  for (const node of graph.nodes) {
    const level = levels[node.id] ?? 0;
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(node);
  }
  const positions = {};
  for (const [level, nodes] of byLevel) {
    const x = maxLevel === 0 ? width/2 : 100 + (level/(maxLevel || 1))*(width-200);
    nodes.forEach((node, i) => {
      const gap = height/(nodes.length+1);
      positions[node.id] = { x, y: gap*(i+1) };
    });
  }
  return positions;
}

function loopLayout(graph, width=900, height=650) {
  const cx=width/2, cy=height/2, radius=Math.min(width,height)*.32, positions={};
  graph.nodes.forEach((node,i)=>{
    const angle=(-Math.PI/2)+(i/Math.max(1,graph.nodes.length))*Math.PI*2;
    positions[node.id]={x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius};
  });
  return positions;
}

function sequenceLayout(graph, width=1100, height=650) {
  const positions={}, gap=width/(graph.nodes.length+1);
  graph.nodes.forEach((node,i)=>positions[node.id]={x:gap*(i+1),y:90});
  return positions;
}

function timelineLayout(graph, width=1100, height=480) {
  const positions={}, gap=width/(graph.nodes.length+1);
  graph.nodes.forEach((node,i)=>positions[node.id]={x:gap*(i+1),y:height/2});
  return positions;
}

function layoutFor(graph) {
  if (graph.type === "loop") return {width:900,height:650,positions:loopLayout(graph)};
  if (graph.type === "sequence") return {width:1100,height:Math.max(520, 170 + graph.edges.length*72),positions:sequenceLayout(graph,1100,Math.max(520,170+graph.edges.length*72))};
  if (graph.type === "timeline") return {width:1100,height:480,positions:timelineLayout(graph)};
  return {width:1200,height:650,positions:layeredLayout(graph)};
}

function nodeBounds(node, pos) {
  const w = n(node.metadata?.width, 154), h = n(node.metadata?.height, 64);
  return {x:pos.x-w/2,y:pos.y-h/2,w,h,cx:pos.x,cy:pos.y};
}

function anchor(bounds, toward) {
  const dx=toward.x-bounds.cx, dy=toward.y-bounds.cy;
  if (Math.abs(dx) >= Math.abs(dy)) return dx>=0 ? {x:bounds.x+bounds.w,y:bounds.cy} : {x:bounds.x,y:bounds.cy};
  return dy>=0 ? {x:bounds.cx,y:bounds.y+bounds.h} : {x:bounds.cx,y:bounds.y};
}

function orthPath(a,b) {
  if (Math.abs(a.x-b.x)<4 || Math.abs(a.y-b.y)<4) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const mid=(a.x+b.x)/2;
  return `M ${a.x} ${a.y} H ${mid} V ${b.y} H ${b.x}`;
}

function nodeShape(node,b) {
  const label=escapeXml(node.label), type=escapeXml(node.type), common=`class="ad-node-shape"`;
  if (node.type==="decision") {
    const p=`${b.cx},${b.y} ${b.x+b.w},${b.cy} ${b.cx},${b.y+b.h} ${b.x},${b.cy}`;
    return `<polygon ${common} points="${p}"/><text class="ad-node-title" x="${b.cx}" y="${b.cy+5}" text-anchor="middle">${label}</text>`;
  }
  if (node.type==="database") {
    return `<rect ${common} x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/>
      <path d="M ${b.x} ${b.y+14} C ${b.x+30} ${b.y+2}, ${b.x+b.w-30} ${b.y+2}, ${b.x+b.w} ${b.y+14}" fill="none" stroke="var(--ad-line)"/>
      <text class="ad-node-sub" x="${b.x+14}" y="${b.y+19}">${type}</text>
      <text class="ad-node-title" x="${b.x+14}" y="${b.cy+12}">${label}</text>`;
  }
  return `<rect ${common} x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/>
    <text class="ad-node-sub" x="${b.x+14}" y="${b.y+20}">${type}</text>
    <text class="ad-node-title" x="${b.x+14}" y="${b.y+43}">${label}</text>`;
}

function renderSequence(graph, plan, layout) {
  const {width,height,positions}=layout, parts=[];
  for (const node of graph.nodes) {
    const p=positions[node.id], label=escapeXml(node.label);
    parts.push(`<g class="ad-node" data-diagram-node="${escapeXml(node.id)}" data-ad-interactive="true" tabindex="0" role="button" aria-label="${label}">
      <rect class="ad-node-shape" x="${p.x-68}" y="44" width="136" height="48" rx="10"/>
      <text class="ad-node-title" x="${p.x}" y="74" text-anchor="middle">${label}</text>
      <line x1="${p.x}" y1="92" x2="${p.x}" y2="${height-45}" stroke="var(--ad-line)" stroke-dasharray="4 6"/>
    </g>`);
  }
  graph.edges.forEach((edge,index)=>{
    const from=positions[edge.from], to=positions[edge.to], y=140+index*62, pid=`ad-path-${domId(edge.id)}`;
    const step=(plan.steps.find(s=>s.edges.includes(edge.id))?.step)||0;
    const action=plan.steps.flatMap(s=>s.actions).find(a=>a.edgeId===edge.id);
    const anim=action?.animation||{style:"dots",duration:1100,gap:8,dotSize:2,reverse:false};
    const d=`M ${from.x} ${y} L ${to.x} ${y}`;
    const mx=(from.x+to.x)/2;
    parts.push(`<path id="${pid}" class="ad-base-edge" data-base-edge data-edge-id="${escapeXml(edge.id)}" data-source="${escapeXml(edge.from)}" data-target="${escapeXml(edge.to)}" data-edge-type="${escapeXml(edge.type)}" d="${d}" marker-end="url(#ad-arrow)"/>`);
    if(edge.label) parts.push(`<text class="ad-edge-label" x="${mx}" y="${y-8}" text-anchor="middle">${escapeXml(edge.label)}</text>`);
    parts.push(flowOverlay(edge,pid,d,step,anim));
  });
  return parts.join("\n");
}

function flowOverlay(edge,pid,d,step,anim) {
  const group=edge.group?` data-edge-group="${escapeXml(edge.group)}"`:"";
  const loop=anim.continuous?"true":"false";
  const style=`--ad-duration:${Math.max(1,anim.duration)}ms;--ad-gap:${Math.max(1,anim.gap)};--ad-dot:${Math.max(.5,anim.dotSize)}`;
  return `<path class="ad-flow" data-ad-flow data-edge-id="${escapeXml(edge.id)}" data-source="${escapeXml(edge.from)}" data-target="${escapeXml(edge.to)}" data-edge-type="${escapeXml(edge.type)}" data-ad-step="${step}" data-ad-loop="${loop}" data-ad-style="${escapeXml(anim.style)}" data-ad-reverse="${anim.reverse}"${group} style="${style}" pathLength="${anim.style==="draw"?1:100}" d="${d}" aria-hidden="true" focusable="false"/>`;
}

function renderGeneric(graph,plan,layout) {
  const {positions}=layout, bounds={}, base=[], overlays=[], labels=[], nodes=[];
  for (const node of graph.nodes) bounds[node.id]=nodeBounds(node,positions[node.id]);
  for (const edge of graph.edges) {
    const a=anchor(bounds[edge.from],positions[edge.to]), b=anchor(bounds[edge.to],positions[edge.from]);
    let d=orthPath(a,b);
    if(graph.type==="loop") {
      const cx=layout.width/2,cy=layout.height/2;
      d=`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
    }
    const pid=`ad-path-${domId(edge.id)}`, step=plan.steps.find(s=>s.edges.includes(edge.id))?.step||0;
    const action=plan.steps.flatMap(s=>s.actions).find(a=>a.edgeId===edge.id);
    const anim=action?.animation||{style:"none",duration:1100,gap:8,dotSize:2,reverse:false,continuous:false};
    const group=edge.group?` data-edge-group="${escapeXml(edge.group)}"`:"";
    base.push(`<path id="${pid}" class="ad-base-edge" data-base-edge data-edge-id="${escapeXml(edge.id)}" data-source="${escapeXml(edge.from)}" data-target="${escapeXml(edge.to)}" data-edge-type="${escapeXml(edge.type)}"${group} d="${d}" marker-end="url(#ad-arrow)"/>`);
    overlays.push(flowOverlay(edge,pid,d,step,anim));
    if(edge.label) {
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2-8;
      labels.push(`<text class="ad-edge-label" x="${mx}" y="${my}" text-anchor="middle">${escapeXml(edge.label)}</text>`);
    }
  }
  for (const node of graph.nodes) {
    const b=bounds[node.id], label=escapeXml(node.label);
    nodes.push(`<g class="ad-node" data-diagram-node="${escapeXml(node.id)}" data-node-type="${escapeXml(node.type)}" data-ad-interactive="true" tabindex="0" role="button" aria-label="${label}">
      ${nodeShape(node,b)}
    </g>`);
  }
  return [...base,...overlays,...labels,...nodes].join("\n");
}

function markStep(plan,itemId) {
  for(const step of plan.steps||[]) if((step.actions||[]).some(a=>a.itemId===itemId)) return step.step;
  return 0;
}
function renderBarChart(graph,plan,width=1000,height=560) {
  const items=graph.data.items||graph.nodes.map((n,i)=>({id:n.id,label:n.label,value:n.metadata?.value??i+1}));
  const max=Math.max(1,...items.map(i=>n(i.value,0))), left=150, top=80, chartW=width-left-60, row= Math.max(34,(height-top-60)/Math.max(1,items.length));
  return items.map((item,i)=>{
    const value=n(item.value,0), wv=(value/max)*chartW, y=top+i*row, id=String(item.id||`bar-${i+1}`), step=markStep(plan,id);
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${step}">
      <text class="ad-node-title" x="${left-12}" y="${y+18}" text-anchor="end">${escapeXml(item.label||id)}</text>
      <rect x="${left}" y="${y}" width="${wv}" height="26" rx="5" fill="var(--ad-accent)" opacity=".9"/>
      <text class="ad-edge-label" x="${left+wv+8}" y="${y+18}">${escapeXml(value)}</text>
    </g>`;
  }).join("\n");
}
function renderLineChart(graph,plan,width=1000,height=560) {
  const points=graph.data.points||graph.nodes.map((n,i)=>({id:n.id,label:n.label,value:n.metadata?.value??i+1}));
  const vals=points.map(p=>n(p.value,p.y??0)), max=Math.max(1,...vals), min=Math.min(0,...vals), left=80,top=60,w=width-140,h=height-130;
  const coords=points.map((p,i)=>({id:String(p.id||`point-${i+1}`),label:p.label||"",x:left+(i/Math.max(1,points.length-1))*w,y:top+h-((vals[i]-min)/Math.max(1,max-min))*h,value:vals[i]}));
  const poly=coords.map(p=>`${p.x},${p.y}`).join(" ");
  return `<polyline class="ad-chart-mark" data-ad-item-id="series" data-ad-item-step="${markStep(plan,"series")}" points="${poly}" fill="none" stroke="var(--ad-accent)" stroke-width="3"/>`+
    coords.map(p=>`<g class="ad-chart-mark" data-ad-item-id="${escapeXml(p.id)}" data-ad-item-step="${markStep(plan,p.id)}"><circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--ad-accent)"/><text class="ad-edge-label" x="${p.x}" y="${p.y-12}" text-anchor="middle">${escapeXml(p.label||p.value)}</text></g>`).join("\n");
}
function renderScatter(graph,plan,width=1000,height=560) {
  const pts=graph.data.points||[], xs=pts.map(p=>n(p.x)), ys=pts.map(p=>n(p.y)), maxX=Math.max(1,...xs),maxY=Math.max(1,...ys),left=70,top=50,w=width-120,h=height-110;
  return pts.map((p,i)=>{
    const id=String(p.id||`point-${i+1}`),x=left+n(p.x)/maxX*w,y=top+h-n(p.y)/maxY*h;
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${markStep(plan,id)}"><circle cx="${x}" cy="${y}" r="${n(p.r,6)}" fill="var(--ad-accent)" opacity=".8"/><text class="ad-edge-label" x="${x+9}" y="${y-9}">${escapeXml(p.label||id)}</text></g>`;
  }).join("\n");
}
function renderGantt(graph,plan,width=1000,height=560) {
  const tasks=graph.data.tasks||[], max=Math.max(1,...tasks.map(t=>n(t.end,1))),left=170,top=60,w=width-220,row=44;
  return tasks.map((t,i)=>{
    const id=String(t.id||`task-${i+1}`),x=left+n(t.start)/max*w,bw=Math.max(4,(n(t.end)-n(t.start))/max*w),y=top+i*row;
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${markStep(plan,id)}"><text class="ad-node-title" x="${left-12}" y="${y+18}" text-anchor="end">${escapeXml(t.label||id)}</text><rect x="${x}" y="${y}" width="${bw}" height="24" rx="6" fill="var(--ad-accent)"/></g>`;
  }).join("\n");
}
function renderMatrix(graph,plan,width=1000,height=560) {
  const rows=graph.data.rows||[], cols=graph.data.columns||[], matrix=graph.data.matrix||[],left=190,top=110,cw=Math.min(120,(width-left-40)/Math.max(1,cols.length)),rh=48;
  let out=cols.map((c,i)=>`<text class="ad-node-title" x="${left+i*cw+cw/2}" y="${top-22}" text-anchor="middle">${escapeXml(c)}</text>`).join("");
  rows.forEach((r,ri)=>{
    out+=`<text class="ad-node-title" x="${left-14}" y="${top+ri*rh+29}" text-anchor="end">${escapeXml(r)}</text>`;
    cols.forEach((c,ci)=>{
      const id=`cell-${ri}-${ci}`,v=matrix[ri]?.[ci]??"—",step=markStep(plan,id);
      out+=`<g class="ad-chart-mark" data-ad-item-id="${id}" data-ad-item-step="${step}"><rect class="ad-node-shape" x="${left+ci*cw}" y="${top+ri*rh}" width="${cw-4}" height="${rh-4}" rx="5"/><text class="ad-node-title" x="${left+ci*cw+(cw-4)/2}" y="${top+ri*rh+28}" text-anchor="middle">${escapeXml(v)}</text></g>`;
    });
  });
  return out;
}
function renderVenn(graph,plan,width=900,height=560) {
  const colors=["var(--ad-accent)","#5b8def","#7a9e7e"];
  return graph.nodes.slice(0,3).map((node,i)=>{
    const x=width/2+(i-1)*115,y=height/2+(i%2)*45-20,id=node.id,step=markStep(plan,id);
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${step}"><circle cx="${x}" cy="${y}" r="150" fill="${colors[i]}" opacity=".22" stroke="${colors[i]}" stroke-width="2"/><text class="ad-node-title" x="${x}" y="${y-110}" text-anchor="middle">${escapeXml(node.label)}</text></g>`;
  }).join("");
}
function renderPyramid(graph,plan,width=900,height=600) {
  const items=graph.nodes, cx=width/2, top=70, totalH=height-130;
  return items.map((node,i)=>{
    const y=top+i*(totalH/items.length), next=top+(i+1)*(totalH/items.length), frac=i/items.length, frac2=(i+1)/items.length;
    const half1=70+frac*280,half2=70+frac2*280,id=node.id,step=markStep(plan,id);
    const pts=`${cx-half1},${y} ${cx+half1},${y} ${cx+half2},${next} ${cx-half2},${next}`;
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${step}"><polygon points="${pts}" fill="var(--ad-card)" stroke="var(--ad-line)"/><text class="ad-node-title" x="${cx}" y="${(y+next)/2+5}" text-anchor="middle">${escapeXml(node.label)}</text></g>`;
  }).join("");
}
function renderLayerStack(graph,plan,width=900,height=560) {
  return graph.nodes.map((node,i)=>{
    const x=140+i*8,y=70+i*72,w=620-i*16,h=54,id=node.id,step=markStep(plan,id);
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${step}"><rect class="ad-node-shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text class="ad-node-title" x="${x+18}" y="${y+33}">${escapeXml(node.label)}</text></g>`;
  }).join("");
}
function renderQuadrant(graph,plan,width=900,height=600) {
  const left=90,top=60,w=width-150,h=height-130;
  let out=`<line x1="${left+w/2}" y1="${top}" x2="${left+w/2}" y2="${top+h}" stroke="var(--ad-line)"/><line x1="${left}" y1="${top+h/2}" x2="${left+w}" y2="${top+h/2}" stroke="var(--ad-line)"/>`;
  out+=graph.nodes.map((node,i)=>{
    const x=left+(n(node.metadata?.x, (i%2)*.65+.2))*w, y=top+h-(n(node.metadata?.y, (i%3)*.28+.18))*h,id=node.id,step=markStep(plan,id);
    return `<g class="ad-chart-mark" data-ad-item-id="${escapeXml(id)}" data-ad-item-step="${step}"><circle cx="${x}" cy="${y}" r="8" fill="var(--ad-accent)"/><text class="ad-node-title" x="${x+12}" y="${y+4}">${escapeXml(node.label)}</text></g>`;
  }).join("");
  return out;
}
function renderRadar(graph,plan,width=800,height=600) {
  const axes=graph.data.axes||graph.nodes.map(n=>({id:n.id,label:n.label,value:n.metadata?.value??.6})),cx=width/2,cy=height/2,r=210;
  const pts=axes.map((a,i)=>{const ang=-Math.PI/2+i*2*Math.PI/axes.length,rr=r*Math.max(0,Math.min(1,n(a.value,.5)));return {x:cx+Math.cos(ang)*rr,y:cy+Math.sin(ang)*rr,ax:cx+Math.cos(ang)*r,ay:cy+Math.sin(ang)*r,a};});
  let out=pts.map(p=>`<line x1="${cx}" y1="${cy}" x2="${p.ax}" y2="${p.ay}" stroke="var(--ad-line)"/><text class="ad-node-title" x="${p.ax}" y="${p.ay}" text-anchor="middle">${escapeXml(p.a.label||p.a.id)}</text>`).join("");
  out+=`<polygon class="ad-chart-mark" data-ad-item-id="radar-series" data-ad-item-step="${markStep(plan,"radar-series")}" points="${pts.map(p=>`${p.x},${p.y}`).join(" ")}" fill="var(--ad-accent)" fill-opacity=".18" stroke="var(--ad-accent)" stroke-width="3"/>`;
  return out;
}

function renderSpecial(graph,plan,layout) {
  if(graph.type==="bar-chart") return renderBarChart(graph,plan,layout.width,layout.height);
  if(graph.type==="line-chart") return renderLineChart(graph,plan,layout.width,layout.height);
  if(graph.type==="scatter-plot") return renderScatter(graph,plan,layout.width,layout.height);
  if(graph.type==="gantt") return renderGantt(graph,plan,layout.width,layout.height);
  if(graph.type==="dp-security-matrix") return renderMatrix(graph,plan,layout.width,layout.height);
  if(graph.type==="venn") return renderVenn(graph,plan,layout.width,layout.height);
  if(graph.type==="pyramid") return renderPyramid(graph,plan,layout.width,layout.height);
  if(graph.type==="layer-stack" || graph.type==="medallion") return renderLayerStack(graph,plan,layout.width,layout.height);
  if(graph.type==="quadrant" || graph.type==="consultant-2x2") return renderQuadrant(graph,plan,layout.width,layout.height);
  if(graph.type==="radar") return renderRadar(graph,plan,layout.width,layout.height);
  return null;
}

export function renderSvg(graph,plan) {
  const layout=layoutFor(graph);
  if(["bar-chart","line-chart","scatter-plot","gantt","dp-security-matrix","venn","pyramid","layer-stack","medallion","quadrant","consultant-2x2","radar"].includes(graph.type)) {
    layout.width=graph.type==="radar"?800:(graph.type==="venn"||graph.type==="pyramid"||graph.type==="layer-stack"||graph.type==="medallion"||graph.type==="quadrant"||graph.type==="consultant-2x2"?900:1000);
    layout.height=graph.type==="timeline"?480:600;
  }
  const titleId=`${domId(graph.id)}-title`,descId=`${domId(graph.id)}-desc`;
  const special=renderSpecial(graph,plan,layout);
  const content=special ?? (graph.type==="sequence"?renderSequence(graph,plan,layout):renderGeneric(graph,plan,layout));
  return `<svg class="ad-svg" data-ad-svg role="img" aria-labelledby="${titleId} ${descId}" viewBox="0 0 ${layout.width} ${layout.height}" xmlns="http://www.w3.org/2000/svg">
    <title id="${titleId}">${escapeXml(graph.title)}</title>
    <desc id="${descId}">${escapeXml(graph.description||`A ${graph.type} diagram with ${graph.nodes.length} nodes and ${graph.edges.length} relationships.`)}</desc>
    <defs><marker id="ad-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ad-line)"/></marker></defs>
    ${content}
  </svg>`;
}

function controls(graph, planBundle) {
  const defaultPlan=planBundle.plans?planBundle.plans[planBundle.defaultScenario||"default"]:planBundle;
  const scenarios=planBundle.plans?Object.keys(planBundle.plans).filter(k=>k!=="default"):[];
  const groups=[...new Set(graph.edges.map(e=>e.group).filter(Boolean))];
  const scenarioSelect=scenarios.length?`<label>Scenario <select data-ad-scenario-select>${scenarios.map(s=>`<option value="${escapeXml(s)}">${escapeXml(graph.scenarios?.[s]?.label||s)}</option>`).join("")}</select></label>`:"";
  const groupUI=groups.length?`<div class="ad-groups" aria-label="Flow groups">${groups.map(g=>`<label><input type="checkbox" checked data-ad-group-toggle="${escapeXml(g)}"> ${escapeXml(g)}</label>`).join("")}</div>`:"";
  return `<div class="ad-controls" aria-label="Animation controls">
    <button type="button" data-ad-action="prev" aria-label="Previous step">Previous</button>
    <button type="button" data-ad-action="play" aria-pressed="false">Play</button>
    <button type="button" data-ad-action="next" aria-label="Next step">Next</button>
    <button type="button" data-ad-action="replay">Replay</button>
    <span class="ad-step-readout" data-ad-readout>Step 0 / ${defaultPlan.stepCount||0}</span>
    <label>Speed <select data-ad-speed><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
    <label><input type="checkbox" checked data-ad-loop-toggle> Loop</label>
    ${scenarioSelect}
  </div>${groupUI}<p class="ad-help">Keyboard: ←/→ steps, Home/End, Space play/pause, R replay, L loop toggle. Select a node to highlight its relationships.</p>`;
}

export function renderHtmlDocument(graph, planBundle, options={}) {
  const defaultScenario=planBundle.defaultScenario||"default";
  const defaultPlan=planBundle.plans?planBundle.plans[defaultScenario]||planBundle.plans.default:planBundle;
  const planJson=JSON.stringify(planBundle).replaceAll("<","\\u003c");
  const svg=renderSvg(graph, defaultPlan);
  const extraCss=options.css||"";
  return `<!doctype html>
<html lang="${escapeXml(options.lang||"en")}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="${graph.theme==="dark"?"dark":"light"}">
  <title>${escapeXml(graph.title)}</title>
  <style>${runtimeCSS}\n${extraCss}</style>
</head>
<body>
  <main class="ad-shell" data-ad-root data-ad-theme="${escapeXml(graph.theme)}" data-ad-state="paused" data-ad-frame="static" data-ad-step="0" data-ad-step-count="${defaultPlan.stepCount||0}" data-ad-scenario="${escapeXml(defaultScenario)}">
    <div class="ad-canvas">${svg}</div>
    ${controls(graph,planBundle)}
    <span class="ad-status" data-ad-status role="status" aria-live="polite" aria-atomic="true"></span>
    <script type="application/json" data-ad-plan>${planJson}</script>
  </main>
  <script>${runtimeJS}</script>
</body>
</html>`;
}

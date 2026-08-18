import { normalizeGraph } from "@animted-diagram/graph";

function clean(value) {
  return String(value ?? "").trim().replace(/^["']|["']$/g,"");
}
function decodeEntities(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi," ")
    .replace(/<[^>]+>/g,"")
    .replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"')
    .replaceAll("&#39;","'").replaceAll("&amp;","&").replaceAll("&nbsp;"," ");
}
function mermaidNode(token) {
  token=token.trim();
  const m=token.match(/^([A-Za-z0-9_.:-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?$/);
  if(!m) return {id:token.replace(/\W+/g,"-"),label:token,type:"process"};
  const label=clean(m[2]||m[3]||m[4]||m[1]);
  return {id:m[1],label,type:m[4]?"decision":"process"};
}

export function importMermaid(source, options={}) {
  const text=String(source||"").replace(/```mermaid/gi,"").replace(/```/g,"").trim();
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const first=(lines[0]||"").toLowerCase();
  let type=options.type || (first.startsWith("sequencediagram")?"sequence":first.startsWith("statediagram")?"state-machine":"flowchart");
  const nodes=new Map(),edges=[]; let edgeIndex=0;

  const ensure=node=>{ if(!nodes.has(node.id)) nodes.set(node.id,node); };

  if(type==="sequence") {
    for(const line of lines.slice(1)) {
      const participant=line.match(/^(?:participant|actor)\s+([A-Za-z0-9_.:-]+)(?:\s+as\s+(.+))?$/i);
      if(participant){ensure({id:participant[1],label:clean(participant[2]||participant[1]),type:"actor"});continue;}
      const msg=line.match(/^(.+?)\s*(-->>|->>|-->|->)\s*(.+?)\s*:\s*(.+)$/);
      if(msg){
        const from=clean(msg[1]),to=clean(msg[3]);
        ensure({id:from,label:from,type:"actor"});ensure({id:to,label:to,type:"actor"});
        edgeIndex+=1;
        edges.push({id:`edge-${edgeIndex}`,from,to,type:msg[2].startsWith("--")?"response":"request",label:clean(msg[4]),order:edgeIndex});
      }
    }
  } else {
    for(const line of lines.slice(1)) {
      if(/^(subgraph|end|direction|classDef|class|style|linkStyle)\b/i.test(line)) continue;
      let m=line.match(/^(.+?)\s*-->\|([^|]+)\|\s*(.+)$/);
      let label="";
      if(m) label=clean(m[2]);
      else m=line.match(/^(.+?)\s*(-->|-.->|==>)\s*(.+)$/);
      if(!m) continue;
      const left=mermaidNode(m[1]),right=mermaidNode(m[m.length-1]);
      ensure(left);ensure(right);edgeIndex+=1;
      edges.push({id:`edge-${edgeIndex}`,from:left.id,to:right.id,type:left.type==="decision"?"conditional":"control",label,order:edgeIndex});
    }
  }
  return normalizeGraph({
    version:1,id:options.id||"imported-mermaid",title:options.title||"Imported Mermaid diagram",
    description:options.description||"Semantic graph imported from Mermaid text.",type,theme:options.theme||"light",
    nodes:[...nodes.values()],edges
  });
}

function attrs(text) {
  const out={};
  for(const m of text.matchAll(/([:\w-]+)\s*=\s*"([^"]*)"/g)) out[m[1]]=m[2];
  return out;
}

export function importDrawioXml(source, options={}) {
  const text=String(source||"");
  if(!/<mxGraphModel\b/i.test(text) && !/<mxCell\b/i.test(text)) throw new Error("Input does not look like uncompressed draw.io XML.");
  const cells=[];
  for(const m of text.matchAll(/<mxCell\b([^>]*?)(?:\/>|>)/g)) cells.push(attrs(m[1]));
  const vertex=cells.filter(c=>c.vertex==="1"&&c.id);
  const ids=new Set(vertex.map(c=>c.id));
  const nodes=vertex.map(c=>({id:c.id,label:clean(decodeEntities(c.value||c.id)),type:"process"}));
  let i=0;
  const edges=cells.filter(c=>c.edge==="1"&&c.source&&c.target&&ids.has(c.source)&&ids.has(c.target)).map(c=>({
    id:c.id||`edge-${++i}`,from:c.source,to:c.target,type:"data",label:clean(decodeEntities(c.value||"")),order:++i
  }));
  return normalizeGraph({
    version:1,id:options.id||"imported-drawio",title:options.title||"Imported draw.io diagram",
    description:options.description||"Semantic graph imported from uncompressed draw.io XML.",
    type:options.type||"architecture",theme:options.theme||"light",nodes,edges
  });
}

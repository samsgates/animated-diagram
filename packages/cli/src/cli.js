#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { buildDiagram, analyzeDiagram, explainDiagram, validateSpecification, validateHtml } from "@animted-diagram/core";
import { decorateDiagramDesignHtml, inferDiagramDesignBindings } from "@animted-diagram/adapter-diagram-design";
import { importMermaid, importDrawioXml } from "@animted-diagram/importers";

const HELP=`
animted-diagram

Commands:
  build <spec.json> [-o output.html] [--preset technical] [--scenario name]
  analyze <spec.json>
  explain <spec.json>
  inspect <spec.json>
  validate <spec.json|diagram.html>
  animate <upstream.html> --graph spec.json --bindings bindings.json [-o output.html]
  infer-bindings <upstream.html> --graph spec.json [-o bindings.json]
  import-mermaid <file.mmd> [-o spec.diagram.json]
  import-drawio <file.drawio> [-o spec.diagram.json]
  init [directory]

Options:
  --preset subtle|normal|technical|presentation|educational|cinematic|fast|none
  --scenario <name>
  --branch branch-all|branch-success|branch-failure|interactive
  --strict true|false
  -o, --output <file>
`;

function parsed(argv) {
  const args=[],flags={};
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(token==="--help"||token==="-h"){flags.help=true;continue;}
    if(token==="-o"||token==="--output"){flags.output=argv[++i];continue;}
    if(token.startsWith("--")){
      const [key,inline]=token.slice(2).split("=",2);
      const next=inline ?? ((argv[i+1]&&!argv[i+1].startsWith("-"))?argv[++i]:true);
      flags[key]=next; continue;
    }
    args.push(token);
  }
  return {args,flags};
}
const loadJson=async file=>JSON.parse(await fs.readFile(file,"utf8"));
const optionsFrom=flags=>({
  preset:flags.preset,scenario:flags.scenario,
  branchStrategy:flags.branch,
  mode:flags.mode
});

async function commandBuild(file,flags){
  const spec=await loadJson(file), result=buildDiagram(spec,optionsFrom(flags));
  const output=flags.output||path.join(path.dirname(file),`${path.basename(file).replace(/\.diagram\.json$|\.json$/,"")}.html`);
  await fs.writeFile(output,result.html);
  console.log(output);
}
async function commandAnalyze(file,flags){
  const analysis=analyzeDiagram(await loadJson(file));
  console.log(JSON.stringify({...analysis,graph:undefined},null,2));
}
async function commandExplain(file,flags){ console.log(explainDiagram(await loadJson(file),optionsFrom(flags))); }
async function commandValidate(file){
  if(/\.html?$/i.test(file)){
    const report=validateHtml(await fs.readFile(file,"utf8"));
    console.log(JSON.stringify(report,null,2)); if(!report.valid) process.exitCode=1; return;
  }
  const report=validateSpecification(await loadJson(file));
  console.log(JSON.stringify({valid:report.valid,errors:report.errors,warnings:report.warnings},null,2)); if(!report.valid) process.exitCode=1;
}
async function commandAnimate(file,flags){
  if(!flags.graph) throw new Error("--graph is required.");
  const html=await fs.readFile(file,"utf8"),spec=await loadJson(flags.graph);
  let bindings;
  if(flags.bindings) bindings=await loadJson(flags.bindings);
  else bindings=inferDiagramDesignBindings(html,spec).bindings;
  const result=decorateDiagramDesignHtml(html,spec,bindings,{...optionsFrom(flags),strict:String(flags.strict??"true")!=="false"});
  const output=flags.output||path.join(path.dirname(file),`${path.basename(file,path.extname(file))}.animated.html`);
  await fs.writeFile(output,result.html);
  console.log(output);
}
async function commandInfer(file,flags){
  if(!flags.graph) throw new Error("--graph is required.");
  const result=inferDiagramDesignBindings(await fs.readFile(file,"utf8"),await loadJson(flags.graph));
  const text=JSON.stringify(result,null,2);
  if(flags.output){await fs.writeFile(flags.output,text);console.log(flags.output);} else console.log(text);
}

async function commandImport(file,flags,kind){
  const source=await fs.readFile(file,"utf8");
  const graph=kind==="mermaid"
    ? importMermaid(source,{title:flags.title,theme:flags.theme,type:flags.type})
    : importDrawioXml(source,{title:flags.title,theme:flags.theme,type:flags.type});
  const output=flags.output||path.join(path.dirname(file),`${path.basename(file,path.extname(file))}.diagram.json`);
  await fs.writeFile(output,JSON.stringify(graph,null,2));
  console.log(output);
}

async function commandInit(dir="."){
  await fs.mkdir(dir,{recursive:true});
  const target=path.join(dir,"example.diagram.json");
  const spec={
    version:1,id:"checkout-flow",title:"Checkout request flow",description:"Browser request travels through API and database, then returns.",
    type:"architecture",theme:"light",
    nodes:[
      {id:"browser",label:"Browser",type:"client"},
      {id:"api",label:"API",type:"api"},
      {id:"db",label:"PostgreSQL",type:"database"}
    ],
    edges:[
      {id:"request",from:"browser",to:"api",type:"request",label:"POST /checkout",order:1},
      {id:"write",from:"api",to:"db",type:"write",label:"INSERT order",order:2},
      {id:"db-result",from:"db",to:"api",type:"response",label:"order id",order:3},
      {id:"response",from:"api",to:"browser",type:"response",label:"201 Created",order:4}
    ],
    config:{preset:"technical"}
  };
  await fs.writeFile(target,JSON.stringify(spec,null,2));
  console.log(target);
}

async function main(){
  const {args,flags}=parsed(process.argv.slice(2));
  if(flags.help||!args.length){console.log(HELP.trim());return;}
  const [command,file]=args;
  if(command==="build") return commandBuild(file,flags);
  if(command==="analyze"||command==="inspect") return commandAnalyze(file,flags);
  if(command==="explain") return commandExplain(file,flags);
  if(command==="validate") return commandValidate(file);
  if(command==="animate") return commandAnimate(file,flags);
  if(command==="infer-bindings") return commandInfer(file,flags);
  if(command==="import-mermaid") return commandImport(file,flags,"mermaid");
  if(command==="import-drawio") return commandImport(file,flags,"drawio");
  if(command==="init") return commandInit(file||".");
  throw new Error(`Unknown command "${command}".\n${HELP}`);
}
main().catch(error=>{console.error(`animted-diagram: ${error.message}`);process.exitCode=1;});

export function validatePlugin(plugin) {
  if(!plugin||typeof plugin!=="object") throw new Error("Plugin must be an object.");
  if(!plugin.name||typeof plugin.name!=="string") throw new Error("Plugin requires a name.");
  for(const hook of ["transformGraph","transformPlanBundle","transformHtml"]) {
    if(plugin[hook]!==undefined&&typeof plugin[hook]!=="function") throw new Error(`${plugin.name}.${hook} must be a function.`);
  }
  return plugin;
}
export function applyGraphPlugins(graph,plugins=[],context={}) {
  return plugins.reduce((value,plugin)=> {
    validatePlugin(plugin);
    return plugin.transformGraph ? (plugin.transformGraph(value,context)||value) : value;
  },graph);
}
export function applyPlanPlugins(bundle,plugins=[],context={}) {
  return plugins.reduce((value,plugin)=>plugin.transformPlanBundle?(plugin.transformPlanBundle(value,context)||value):value,bundle);
}
export function applyHtmlPlugins(html,plugins=[],context={}) {
  return plugins.reduce((value,plugin)=>plugin.transformHtml?(plugin.transformHtml(value,context)||value):value,html);
}
export function definePlugin(plugin){ return validatePlugin(plugin); }

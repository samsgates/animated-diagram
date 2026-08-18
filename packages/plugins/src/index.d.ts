export interface AnimatedDiagramPlugin {
  name:string;
  transformGraph?(graph:any,context:any):any;
  transformPlanBundle?(bundle:any,context:any):any;
  transformHtml?(html:string,context:any):string;
}
export function definePlugin(plugin:AnimatedDiagramPlugin): AnimatedDiagramPlugin;
export function validatePlugin(plugin:AnimatedDiagramPlugin): AnimatedDiagramPlugin;
export function applyGraphPlugins(graph:any,plugins?:AnimatedDiagramPlugin[],context?:any):any;
export function applyPlanPlugins(bundle:any,plugins?:AnimatedDiagramPlugin[],context?:any):any;
export function applyHtmlPlugins(html:string,plugins?:AnimatedDiagramPlugin[],context?:any):string;

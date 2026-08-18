import type { DiagramSpecification } from "@animted-diagram/graph";
export interface DiagramDesignBindings {
  edges?: Record<string,{pathId:string;reverse?:boolean}>;
  nodes?: Record<string,{elementId:string}>;
}
export function inferDiagramDesignBindings(html:string,input:DiagramSpecification): {bindings:DiagramDesignBindings;unresolved:{edges:string[];nodes:string[]}};
export function decorateDiagramDesignHtml(html:string,input:DiagramSpecification,bindings?:DiagramDesignBindings,options?:Record<string,any>): {html:string;unresolved:string[];planBundle:any};

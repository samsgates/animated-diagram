import type { DiagramSpecification } from "@animted-diagram/graph";
export function buildPlanBundle(input: DiagramSpecification, options?: Record<string, any>): any;
export function buildDiagram(input: DiagramSpecification, options?: Record<string, any>): {
  graph: DiagramSpecification;
  planBundle: any;
  html: string;
};
export function analyzeDiagram(input: DiagramSpecification): any;
export function explainDiagram(input: DiagramSpecification, options?: Record<string, any>): string;
export function validateSpecification(input: DiagramSpecification): {valid:boolean;errors:string[];warnings:string[];analysis?:any};
export function validateHtml(html: string): {valid:boolean;errors:string[];warnings:string[]};

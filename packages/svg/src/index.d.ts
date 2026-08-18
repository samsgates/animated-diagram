import type { DiagramSpecification } from "@animted-diagram/graph";
export function escapeXml(value: unknown): string;
export function domId(value: unknown): string;
export function renderSvg(graph: DiagramSpecification, plan: any): string;
export function renderHtmlDocument(graph: DiagramSpecification, planBundle: any, options?: Record<string, any>): string;

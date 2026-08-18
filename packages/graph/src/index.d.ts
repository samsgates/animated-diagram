export type DiagramType =
  | "architecture" | "flowchart" | "sequence" | "state-machine" | "er"
  | "timeline" | "swimlane" | "quadrant" | "nested" | "tree" | "org-chart"
  | "venn" | "layer-stack" | "pyramid" | "consultant-2x2" | "radar" | "loop"
  | "it-current-state" | "high-level" | "bar-chart" | "line-chart" | "gantt"
  | "scatter-plot" | "process" | "medallion" | "data-flow" | "dp-integration"
  | "dp-security-matrix";

export interface DiagramNode {
  id: string;
  label?: string;
  type?: string;
  group?: string;
  position?: { x: number; y: number };
  metadata?: Record<string, unknown>;
}
export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  type?: string;
  label?: string;
  order?: number;
  group?: string;
  condition?: string;
  reverse?: boolean;
  priority?: number;
  animation?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
export interface DiagramSpecification {
  version?: number;
  id?: string;
  title?: string;
  description?: string;
  type: DiagramType;
  theme?: "light" | "dark";
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  scenarios?: Record<string, string[] | { edges: string[]; nodes?: string[]; label?: string }>;
  data?: Record<string, any>;
  config?: Record<string, any>;
}
export const DIAGRAM_TYPES: readonly DiagramType[];
export const NODE_TYPES: readonly string[];
export const EDGE_TYPES: readonly string[];
export function normalizeGraph(input: DiagramSpecification): DiagramSpecification;
export function analyzeGraph(input: DiagramSpecification): any;
export function detectCycles(graph: DiagramSpecification): Array<{nodes:string[];edges:string[]}>;
export function buildAdjacency(graph: DiagramSpecification): {outgoing:Map<string,DiagramEdge[]>;incoming:Map<string,DiagramEdge[]>};
export function isFlowEdge(edge: DiagramEdge): boolean;
export function isBackEdge(edge: DiagramEdge): boolean;

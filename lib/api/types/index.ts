import { z } from "zod";
import {
  AxisSchema,
  ChartConfigSchema,
  ChartVisualSchema,
  ComponentSchema,
  DataSeriesItemSchema,
  ErrorReasonSchema,
  InsightsSchema,
  KeySubjectSchema,
  QueryParsingSchema,
  SqlGenerationSchema,
  SummarySchema,
} from "../outputSchema";

export type StreamCallback = (
  content: string,
  type: "status" | "content" | "error"
) => void;

export type DbResult = { data: any[] | null; rowCount: number; error: string | null }

// Inferred TypeScript type
export type KeySubject = z.infer<typeof KeySubjectSchema>;
export type QueryParsingResult = z.infer<typeof QueryParsingSchema>;
export type SqlGenerationResult = z.infer<typeof SqlGenerationSchema>;
export type ErrorReasonResult = z.infer<typeof ErrorReasonSchema>;
export type SummaryResult = z.infer<typeof SummarySchema>;
export type InsightsResult = z.infer<typeof InsightsSchema>;
export type DataSeriesItem = z.infer<typeof DataSeriesItemSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type Axis = z.infer<typeof AxisSchema>;
export type ChartVisual = z.infer<typeof ChartVisualSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;

export interface QueryResponse {
  query: SqlGenerationResult;
  visuals: ChartVisual[];
  summary: SummaryResult;
  error: string | null;
}

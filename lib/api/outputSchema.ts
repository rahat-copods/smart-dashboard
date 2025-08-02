import { z } from "zod";

export const KeySubjectSchema = z.object({
  subject: z.string().describe("Important subject/entity from the query"),
  weight: z
    .number()
    .min(0)
    .max(10)
    .describe("Importance weight (0-10, 10 being most important)"),
  context: z.string().describe("Why this subject is important in the query"),
});

export const QueryParsingSchema = z.object({
  userQuery: z.string().describe("The original user query"),
  queryIntent: z
    .string()
    .describe("What the user is trying to accomplish in simple terms"),
  keySubjects: z
    .array(KeySubjectSchema)
    .describe("Key subjects identified in the query with importance weights"),
  primaryFocus: z.string().describe("The main thing the user cares about most"),
  contextInfluence: z
    .string()
    .nullable()
    .describe(
      "How previous conversation context affects understanding of this query"
    ),
  summary: z.string().describe("Brief summary of what the user is asking for"),
  reasoning: z
    .string()
    .describe(
      "Brief reasoning of how you processed in Markdown format. Start with '## Understanding Request' as the heading."
    ),
});

export const SqlGenerationSchema = z.object({
  sqlQuery: z
    .string()
    .nullable()
    .describe("The generated SQL query (null if error occurred)"),
  isPartial: z
    .boolean()
    .nullable()
    .describe(
      "Whether the SQL query is incomplete or partial (null if error occurred)"
    ),
  partialReason: z
    .string()
    .nullable()
    .describe(
      "Reason why the query is partial, if applicable (null if not partial or error occurred)"
    ),
  error: z
    .string()
    .nullable()
    .describe(
      "Error message when query cannot be generated due to schema mismatch or incompatible request"
    ),
  suggestions: z
    .array(z.string())
    .describe(
      "A list of 3–4 natural language follow-up questions that could be asked next, based on the current question and response — e.g., filtering further, comparing results, or digging deeper into related metrics."
    ),
  reasoning: z
    .string()
    .describe(
      "Brief reasoning of how you processed in Markdown format. Start with '## Generating Query' as the heading."
    ),
});

export const ErrorReasonSchema = z.object({
  errorReason: z
    .string()
    .describe(
      "Detailed explanation of why the request failed or could not be processed"
    ),
});

export const SummarySchema = z.object({
  summary: z
    .string()
    .describe(
      "A Markdown format Summary for the conversion of the user query to SQL"
    ),
});

export const InsightsSchema = z.object({
  Insights: z
    .string()
    .describe(
      "A Markdown format Insights for the data provided by user"
    ),
});

//#region Chart Config Schema

// Level 3: Data Series Configuration (deepest level)
export const DataSeriesItemSchema = z.object({
  key: z.string().describe("The data key identifier"),
  label: z
    .string()
    .describe(
      "The display label for the data series, derived from the SQL query column name."
    ),
  color: z
    .enum([
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ])
    .describe("The color for the data series, specified as a CSS variable."),
});

// Level 3: Component Configuration
export const ComponentSchema = z.object({
  dataKey: z
    .string()
    .describe(
      "The key in chartData objects used for the component's data values"
    ),
  fill: z.string().describe("The fill color for the component"),
});

// Level 2: Axis Configuration
export const AxisSchema = z.object({
  dataKey: z
    .string()
    .describe("The key in chartData objects used for axis values"),
});

// Level 2: Single Chart Visual Configuration
export const ChartVisualSchema = z.object({
  type: z.literal("chart").describe("Chart category identifier"),
  dataSeries: z
    .array(DataSeriesItemSchema)
    .min(1)
    .describe("Array of data series configurations from the SQL query"),
  components: z
    .array(ComponentSchema)
    .describe("Configuration for chart components"),
  xAxis: AxisSchema.describe("Configuration for the X-axis"),
  yAxis: AxisSchema.describe("Configuration for the Y-axis"),
});

// Level 1: Main Chart Config Schema
export const ChartConfigSchema = z.object({
  visuals: z
    .array(ChartVisualSchema)
    .min(1)
    .describe(
      "An array of one or more chart configurations, each defining a specific visualization to represent the SQL query results."
    ),
  reasoning: z
    .string()
    .describe(
      "Brief reasoning of how you processed in Markdown format. Start with '## Figuring Out Visuals' as the heading."
    ),
});

// Inferred TypeScript type
export type KeySubject = z.infer<typeof KeySubjectSchema>;
export type QueryParsingResult = z.infer<typeof QueryParsingSchema>;
export type SqlGenerationResult = z.infer<typeof SqlGenerationSchema>;
export type ErrorReasonResult = z.infer<typeof ErrorReasonSchema>;
export type DataSeriesItem = z.infer<typeof DataSeriesItemSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type Axis = z.infer<typeof AxisSchema>;
export type ChartVisual = z.infer<typeof ChartVisualSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;

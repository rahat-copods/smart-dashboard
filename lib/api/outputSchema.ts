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
      "How previous conversation context affects understanding of this query",
    ),
  summary: z.string().describe("Brief summary of what the user is asking for"),
  reasoning: z
    .string()
    .describe(
      "Brief analysis and decision-making process in markdown format, starting with 2nd level headings (##)",
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
      "Whether the SQL query is incomplete or partial (null if error occurred)",
    ),
  partialReason: z
    .string()
    .nullable()
    .describe(
      "Reason why the query is partial, if applicable (null if not partial or error occurred)",
    ),
  error: z
    .string()
    .nullable()
    .describe(
      "Error message when query cannot be generated due to schema mismatch or incompatible request",
    ),
  explanation: z
    .string()
    .nullable()
    .describe(
      "Markdown format Contextual information explaining the details about database structure for explanation queries (null if not needed)",
    ),
  suggestions: z
    .array(z.string())
    .describe(
      "A list of 3–4 natural language follow-up questions that could be asked next, based on the current question and response — e.g., filtering further, comparing results, or digging deeper into related metrics.",
    ),
  reasoning: z
    .string()
    .describe(
      "Brief analysis and decision-making process in markdown format, starting with 2nd level headings (##)",
    ),
});

export const ErrorReasonSchema = z.object({
  errorReason: z
    .string()
    .describe(
      "brief explanation of why the request failed or could not be processed (40-50 words) in Markdown format",
    ),
});

export const SummarySchema = z.object({
  summary: z
    .string()
    .describe(
      "A Markdown format Summary for the conversion of the user query to SQL (150-200 words)",
    ),
});

export const InsightsSchema = z.object({
  insights: z
    .string()
    .describe("A Markdown format Insights for the data provided by user"),
  suggestions: z
    .array(z.string())
    .describe(
      "A list of 2-3 natural language follow-up questions that could be asked next, based on the insights provided — e.g., filtering further, comparing results, or digging deeper into related metrics.",
    ),
});

//#region Chart Config Schema

export const SortingSchema = z
  .object({
    sortKey: z
      .string()
      .describe(
        "The key from the data objects representing the column to use for sort order of the data series. Must match exact SQL SELECT column name.",
      ),
    sortOrder: z
      .enum(["asc", "desc"])
      .describe("The sort order for the data series"),
  })
  .describe("Configuration for sort and order when data needs to be sorted");

// Level 2: Axis Configuration
export const AxisSchema = z.object({
  key: z
    .string()
    .describe("Must match exact SQL SELECT column name used for axis values"),
  label: z.string().describe("Human-readable label for the axis"),
});

export const ChartVisualSchema = z.object({
  type: z.enum(["bar", "line", "area"]).describe("Chart category identifier"),
  title: z.string().describe("Chart title"),
  description: z
    .string()
    .describe("Chart description explaining what it shows"),
  filterKey: z
    .string()
    .nullable()
    .describe(
      "Optional key to filter the data by. If provided, a dropdown will appear to allow users to select a specific category to display. Must match exact SQL SELECT column name.",
    ),
  seriesKey: z
    .string()
    .nullable()
    .describe(
      "Optional key whose unique values will form different series (e.g., for stacked bars). If provided, the chart will pivot the data to create separate bars/segments for each unique value of this key. Must match exact SQL SELECT column name.",
    ),
  xAxis: AxisSchema.describe("Configuration for the X-axis").required(),
  yAxis: AxisSchema.describe("Configuration for the Y-axis").required(),
  valueKey: z
    .array(z.string())
    .describe(
      "The key from the data objects representing the numerical value to be plotted (e.g., the height of the bars). Must match exact SQL SELECT column name.",
    )
    .nonempty(),
  isPivoted: z.boolean().describe("Whether the data is pivoted or not"),
  sort: SortingSchema.nullable().describe(
    "Configuration for sort and order when data needs to be sorted",
  ),
});

// Level 1: Main Chart Config Schema
export const ChartConfigSchema = z.object({
  visuals: z
    .array(ChartVisualSchema)
    .min(1)
    .nullable()
    .describe(
      "An array of one or more chart configurations, each defining a specific visualization to represent the SQL query results.",
    ),
  reasoning: z
    .string()
    .describe(
      "Brief analysis and decision-making process in markdown format, starting with 2nd level headings (##)",
    ),
});

import { z } from "zod";

export const VisualConfigSchema = z.object({
  xAxis: z
    .object({
      dimension: z.string().describe("Column/field for x-axis"),
      type: z
        .enum(["categorical", "temporal", "numeric"])
        .describe("Data type of x-axis"),
      label: z.string().describe("Human-readable label for x-axis"),
    })
    .describe("X-axis configuration"),

  yAxis: z
    .object({
      dimension: z
        .string()
        .describe("Column/field for y-axis (usually numeric)"),
      type: z.enum(["numeric"]).describe("Data type of y-axis"),
      label: z.string().describe("Human-readable label for y-axis"),
    })
    .describe("Y-axis configuration"),

  categoricalDimensions: z
    .array(
      z.object({
        dimension: z.string().describe("Column/field for categorical grouping"),
        visualElement: z
          .enum(["color", "size", "shape", "pattern"])
          .describe("How to represent this dimension visually"),
        label: z.string().describe("Human-readable label for this dimension"),
      })
    )
    .max(2)
    .describe("Additional categorical dimensions (max 2)"),

  filters: z
    .array(
      z.object({
        dimension: z.string().describe("Column/field to filter"),
        condition: z
          .string()
          .describe("Filter condition (e.g., 'top 5', 'Q4 2024', '> 1000')"),
      })
    )
    .describe("Applied filters for this visualization"),

  title: z.string().describe("Suggested title for this visualization"),
  description: z
    .string()
    .describe("Brief description of what this visual shows"),
});

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
  // visualConfigs: z
  //   .array(VisualConfigSchema)
  //   .min(1)
  //   .describe(
  //     "Array of visualization configurations. Single item if ≤4 dimensions, multiple items if complex query requires splitting"
  //   ),
  reasoning: z
    .string()
    .describe(
      "Brief analysis and decision-making process in markdown format, starting with 2nd level headings (##)"
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
      "Brief analysis and decision-making process in markdown format, starting with 2nd level headings (##)"
    ),
});

export const ErrorReasonSchema = z.object({
  errorReason: z
    .string()
    .describe(
      "brief explanation of why the request failed or could not be processed (40-50 words) in Markdown format"
    ),
});

export const SummarySchema = z.object({
  summary: z
    .string()
    .describe(
      "A Markdown format Summary for the conversion of the user query to SQL (150-200 words)"
    ),
});

export const InsightsSchema = z.object({
  insights: z
    .string()
    .describe("A Markdown format Insights for the data provided by user"),
  suggestions: z
    .array(z.string())
    .describe(
      "A list of 2-3 natural language follow-up questions that could be asked next, based on the insights provided — e.g., filtering further, comparing results, or digging deeper into related metrics."
    ),
});

//#region Chart Config Schema

export const FilterSelectSchema = z
  .object({
    dataKey: z
      .string()
      .describe("Must be exact SQL SELECT column name to filter by"),
    label: z.string().describe("Human-readable label for the filter select"),
  })
  .describe(
    "Configuration for filter/select dropdown when data has too many dimensions"
  );

// Level 3: Data Series Configuration
export const DataSeriesItemSchema = z.object({
  key: z
    .string()
    .describe(
      "The exact SQL column name from the SELECT statement - must match query results exactly"
    ),
  label: z
    .string()
    .describe("Human-readable display label derived from the SQL column name"),
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
      "CRITICAL: Must exactly match one of the dataSeries keys - refers to the same SQL SELECT column name used in dataSeries configuration"
    ),
  fill: z.string().describe("The fill color for the component"),
});

// Level 2: Axis Configuration
export const AxisSchema = z.object({
  dataKey: z
    .string()
    .describe("Must match exact SQL SELECT column name used for axis values"),
  label: z.string().describe("Human-readable label for the axis"),
});

// Level 2: Single Chart Visual Configuration (UPDATED)
export const ChartVisualSchema = z.object({
  type: z.literal("chart").describe("Chart category identifier"),
  dataSeries: z
    .array(DataSeriesItemSchema)
    .min(1)
    .describe(
      "Array of data series configurations from the SQL query output column names"
    ),
  components: z
    .array(ComponentSchema)
    .describe("Configuration for chart components"),
  xAxis: AxisSchema.describe("Configuration for the X-axis"),
  yAxis: AxisSchema.describe("Configuration for the Y-axis"),
  filterSelect: FilterSelectSchema.nullable().describe(
    "Filter/select configuration for complex data with 4+ dimensions, null if not needed"
  ),
  title: z.string().describe("Chart title"),
  description: z
    .string()
    .describe("Chart description explaining what it shows"),
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
      "Brief analysis and decision-making process in markdown format, starting with 2nd level headings (##)"
    ),
});

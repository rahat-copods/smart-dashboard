export const queryParsingSchema = {
  type: "object",
  properties: {
    userQuery: {
      type: "string",
      description: "The original user query",
    },
    queryIntent: {
      type: "string",
      description: "What the user is trying to accomplish in simple terms",
    },
    keySubjects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "Important subject/entity from the query",
          },
          weight: {
            type: "number",
            minimum: 0,
            maximum: 10,
            description: "Importance weight (0-10, 10 being most important)",
          },
          context: {
            type: "string",
            description: "Why this subject is important in the query",
          },
        },
        required: ["subject", "weight", "context"],
      },
      description:
        "Key subjects identified in the query with importance weights",
    },
    primaryFocus: {
      type: "string",
      description: "The main thing the user cares about most",
    },
    contextInfluence: {
      type: ["string", "null"],
      description:
        "How previous conversation context affects understanding of this query",
    },
    summary: {
      type: "string",
      description: "Brief summary of what the user is asking for",
    },
  },
  required: [
    "userQuery",
    "queryIntent",
    "keySubjects",
    "primaryFocus",
    "summary",
  ],
  additionalProperties: false,
};

export const sqlGenerationSchema = {
  type: "object",
  properties: {
    sqlQuery: {
      type: ["string", "null"],
      description: "The generated SQL query (null if error occurred)",
    },
    isPartial: {
      type: ["boolean", "null"],
      description:
        "Whether the SQL query is incomplete or partial (null if error occurred)",
    },
    partialReason: {
      type: ["string", "null"],
      description:
        "Reason why the query is partial, if applicable (null if not partial or error occurred)",
    },
    error: {
      type: ["string", "null"],
      description:
        "Error message when query cannot be generated due to schema mismatch or incompatible request",
    },
    suggestions: {
      type: "array",
      description:
        "A list of 3–4 natural language follow-up questions that could be asked next, based on the current question and response — e.g., filtering further, comparing results, or digging deeper into related metrics.",
      items: {
        type: "string",
      },
    },
  },
  required: ["sqlQuery", "isPartial", "partialReason", "error", "suggestions"],
  additionalProperties: false,
};

// Chart Configuration Schema - Supporting 6 chart types with shadcn/recharts integration

// Chart configuration using oneOf for conditional logic

export const chartConfigSchema = {
  type: "object",
  properties: {
    visuals: {
      type: "array",
      description:
        "An array of one or more chart configurations, each defining a specific visualization to represent the SQL query results.",
      minItems: 1,
      items: {
        type: "object",
        description:
          "Configuration for a single chart visualization, mapping SQL query result columns to chart series with labels, colors, and component data keys.",
        properties: {
          type: {
            type: "string",
            const: "chart",
            description: "Chart category identifier",
          },
          dataSeries: {
            type: "object",
            description:
              "Configuration for each data series from the SQL query, mapping to shadcn ChartConfig structure.",
            additionalProperties: {
              type: "object",
              description:
                "Configuration for a single data series, defining its label and color.",
              properties: {
                label: {
                  type: "string",
                  description:
                    "The display label for the data series, derived from the SQL query column name.",
                },
                color: {
                  type: "string",
                  description:
                    "The color for the data series, specified as a CSS variable.",
                  enum: [
                    "var(--chart-1)",
                    "var(--chart-2)",
                    "var(--chart-3)",
                    "var(--chart-4)",
                    "var(--chart-5)",
                  ],
                },
              },
              required: ["label", "color"],
              additionalProperties: false,
            },
            minProperties: 1,
          },
          components: {
            type: "array",
            description:
              "Configuration for chart components, dynamically generated based on the data series in chartData.",
            items: {
              type: "object",
              description:
                "Configuration for a single chart component (Bar, Line, Area), tied to a data series key from chartData.",
              properties: {
                dataKey: {
                  type: "string",
                  description:
                    "The key in chartData objects used for the component's data values, matching a key in dataSeries.",
                  pattern: "^[a-zA-Z0-9_]+$",
                },
                fill: {
                  type: "string",
                  description:
                    "The fill color for the component, typically 'var(--color-<dataKey>)' matching the dataSeries key.",
                  pattern: "^var\\(--color-[a-zA-Z0-9]+\\)$",
                },
              },
              required: ["dataKey", "fill"],
              additionalProperties: false,
            },
          },
          xAxis: {
            type: "object",
            description:
              "Configuration for the <XAxis> component, specifying the data key for x-axis values.",
            properties: {
              dataKey: {
                type: "string",
                description:
                  "The key in chartData objects used for x-axis values, derived from the SQL query output.",
                pattern: "^[a-zA-Z0-9_]+$",
              },
            },
            required: ["dataKey"],
            additionalProperties: false,
          },
          yAxis: {
            type: "object",
            description:
              "Configuration for the <YAxis> component, specifying the data key for y-axis values.",
            properties: {
              dataKey: {
                type: "string",
                description:
                  "The key in chartData objects used for y-axis values, derived from the SQL query output.",
                pattern: "^[a-zA-Z0-9_]+$",
              },
            },
            required: ["dataKey"],
            additionalProperties: false,
          },
        },
        required: ["type", "dataSeries", "components", "xAxis", "yAxis"],
        additionalProperties: false,
      },
    },
  },
  required: ["visuals"],
  additionalProperties: false,
};
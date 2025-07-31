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
      description: "The generated SQL query (null if error occurred)"
    },
    isPartial: {
      type: ["boolean", "null"],
      description: "Whether the SQL query is incomplete or partial (null if error occurred)"
    },
    partialReason: {
      type: ["string", "null"],
      description: "Reason why the query is partial, if applicable (null if not partial or error occurred)"
    },
    error: {
      type: ["string", "null"],
      description: "Error message when query cannot be generated due to schema mismatch or incompatible request"
    }
  },
  required: ["sqlQuery", "isPartial", "partialReason", "error"],
  additionalProperties: false
};


// Chart Configuration Schema - Supporting 6 chart types with shadcn/recharts integration
const dataSeries = {
  type: "object",
  description:
    "Configuration for each data series from the SQL query, mapping to shadcn ChartConfig structure. Each property key corresponds to a data column from the SQL query result. This object contains multiple data series configurations, with one object per output column that represents chart data.",
  additionalProperties: {
    type: "object",
    description:
      "Configuration for a single data series, defining its label and color. The property key should match the corresponding column name from the SQL query output.",
    properties: {
      label: {
        type: "string",
        description:
          "The display label for the data series, derived from the SQL query column name or a user-friendly version (e.g., 'Desktop' for column 'desktop').",
      },
      color: {
        type: "string",
        description:
          "The color for the data series, specified as CSS variable should be one of: var(--chart-1), var(--chart-2), var(--chart-3), var(--chart-4), or var(--chart-5), used to generate 'var(--color-<key>)' for the component's fill.",
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
};

const xAxis = {
  type: "object",
  description:
    "Configuration for the <XAxis> component, specifying the data key for x-axis values.",
  properties: {
    dataKey: {
      type: "string",
      description:
        "The key in chartData objects used for x-axis values (e.g., 'month'), derived from the SQL query output. Must correspond to a column in the query results.",
    },
  },
  required: ["dataKey"],
  additionalProperties: false,
};

const yAxis = {
  type: "object",
  description:
    "Configuration for the <YAxis> component, specifying the data key for y-axis values.",
  properties: {
    dataKey: {
      type: "string",
      description:
        "The key in chartData objects used for y-axis values (e.g., 'cost or count'), derived from the SQL query output. Must correspond to a column in the query results.",
    },
  },
  required: ["dataKey"],
  additionalProperties: false,
};

const chartComponent = {
  type: "object",
  description:
    "Configuration for a single chart component (Bar, Line, Area), tied to a data series key from chartData.",
  properties: {
    dataKey: {
      type: "string",
      description:
        "The key in chartData objects used for the component's data values (e.g., 'desktop', 'mobile'), matching a key in dataSeries. Must correspond to a column in the SQL query output.",
    },
    fill: {
      type: "string",
      description:
        "The fill color for the component, derived from the dataSeries' color, formatted as a CSS variable (e.g., 'var(--color-desktop)') to reference the corresponding dataSeries key's color.",
      enum: [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ],
    },
  },
  required: ["dataKey", "fill"],
  additionalProperties: false,
};

const graphComponent = {
  type: "object",
  description:
    "Configuration for graph components (Pie, Radar, Radial) with specialized properties.",
  properties: {
    dataKey: {
      type: "string",
      description:
        "The key in chartData objects used for the component's data values, matching a key in dataSeries. Must correspond to a column in the SQL query output.",
    },
    categoryKey: {
      type: ["string", "null"],
      description:
        "The key for category/label data (used in pie charts for slice labels), derived from SQL query output.",
    },
    fill: {
      type: "string",
      description:
        "The fill color for the component, using shadcn CSS variables.",
      enum: [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ],
    },
  },
  required: ["dataKey", "fill"],
  additionalProperties: false,
};

// Chart configuration using oneOf for conditional logic
const singleChartConfig = {
  type: "object",
  description:
    "Configuration for a single chart visualization, mapping SQL query result columns to chart series with labels, colors, and component data keys.",
  oneOf: [
    {
      type: "object",
      description:
        "Bar chart configuration - suitable for categorical data comparisons, discrete values, or when showing data distribution across categories.",
      properties: {
        type: {
          type: "string",
          const: "chart",
          description: "Chart category identifier",
        },
        chartType: {
          type: "string",
          const: "bar",
          description: "Specific chart type for bar charts",
        },
        dataSeries: dataSeries,
        components: {
          type: "array",
          description:
            "Configuration for chart components, dynamically generated based on the data series in chartData.",
          items: chartComponent,
        },
        xAxis: xAxis,
        yAxis: yAxis,
      },
      required: ["type", "chartType", "dataSeries", "components", "xAxis", "yAxis"],
      additionalProperties: false,
    },
    {
      type: "object",
      description:
        "Line chart configuration - suitable for time series data, trends over time, continuous data, or when showing data progression and patterns.",
      properties: {
        type: {
          type: "string",
          const: "chart",
          description: "Chart category identifier",
        },
        chartType: {
          type: "string",
          const: "line",
          description: "Specific chart type for line charts",
        },
        dataSeries: dataSeries,
        components: {
          type: "array",
          description:
            "Configuration for chart components, dynamically generated based on the data series in chartData.",
          items: chartComponent,
        },
        xAxis: xAxis,
        yAxis: yAxis,
      },
      required: ["type", "chartType", "dataSeries", "components", "xAxis", "yAxis"],
      additionalProperties: false,
    },
    {
      type: "object",
      description:
        "Area chart configuration - suitable for showing cumulative data, filled regions, or emphasizing volume/magnitude over time.",
      properties: {
        type: {
          type: "string",
          const: "chart",
          description: "Chart category identifier",
        },
        chartType: {
          type: "string",
          const: "area",
          description: "Specific chart type for area charts",
        },
        dataSeries: dataSeries,
        components: {
          type: "array",
          description:
            "Configuration for chart components, dynamically generated based on the data series in chartData.",
          items: chartComponent,
        },
        xAxis: xAxis,
        yAxis: yAxis,
      },
      required: ["type", "chartType", "dataSeries", "components", "xAxis", "yAxis"],
      additionalProperties: false,
    },
    {
      type: "object",
      description:
        "Pie chart configuration - suitable for showing proportions, percentages, or parts of a whole.",
      properties: {
        type: {
          type: "string",
          const: "graph",
          description: "Graph category identifier",
        },
        chartType: {
          type: "string",
          const: "pie",
          description: "Specific chart type for pie charts",
        },
        dataSeries: dataSeries,
        components: {
          type: "array",
          description:
            "Configuration for graph components, specialized for pie chart visualization.",
          items: graphComponent,
        },
      },
      required: ["type", "chartType", "dataSeries", "components"],
      additionalProperties: false,
    },
    {
      type: "object",
      description:
        "Radar chart configuration - suitable for multivariate data comparison, showing multiple metrics simultaneously.",
      properties: {
        type: {
          type: "string",
          const: "graph",
          description: "Graph category identifier",
        },
        chartType: {
          type: "string",
          const: "radar",
          description: "Specific chart type for radar charts",
        },
        dataSeries: dataSeries,
        components: {
          type: "array",
          description:
            "Configuration for graph components, specialized for radar chart visualization.",
          items: graphComponent,
        },
      },
      required: ["type", "chartType", "dataSeries", "components"],
      additionalProperties: false,
    },
    {
      type: "object",
      description:
        "Radial chart configuration - suitable for circular data representation, progress indicators, or radial comparisons.",
      properties: {
        type: {
          type: "string",
          const: "graph",
          description: "Graph category identifier",
        },
        chartType: {
          type: "string",
          const: "radial",
          description: "Specific chart type for radial charts",
        },
        dataSeries: dataSeries,
        components: {
          type: "array",
          description:
            "Configuration for graph components, specialized for radial chart visualization.",
          items: graphComponent,
        },
      },
      required: ["type", "chartType", "dataSeries", "components"],
      additionalProperties: false,
    },
  ],
};

export const chartConfigSchema = {
  type: "object",
  properties: {
    visuals: {
      type: "array",
      description:
        "An array of one or more chart configurations, each defining a specific visualization to represent the SQL query results. Multiple configurations are used when data contains unrelated groups that require separate visualizations. Each configuration maps SQL query result columns to chart series with labels, colors, and component data keys.",
      items: singleChartConfig,
      minItems: 1,
    }
  },
  required: ["visuals"],
  additionalProperties: false,
};

export const getQueryParsingPrompt = (
  schema: string,
  previousSummary: string | null,
  userQuery: string
) => `You are an expert at understanding user queries and identifying what matters most to them.

## Your Task
Analyze the user's query to understand their intent and identify the most important subjects/entities they care about.

## Database Schema Context
${schema}

## Previous Context
${previousSummary ? `Previous conversation: ${previousSummary}` : 'No previous context.'}

## User Query
"${userQuery}"

## Instructions
1. **Understand Intent**: What is the user really trying to find out or accomplish?

2. **Identify Key Subjects**: Extract the most important subjects/entities mentioned:
   - Business metrics (sales, revenue, customers, etc.)
   - Time periods (dates, ranges, trends)
   - Categories/dimensions (regions, products, departments)
   - Specific entities (company names, product names, etc.)

3. **Assign Weights**: Rate each subject's importance (0-10):
   - 10: Critical to answering the query
   - 7-9: Very important
   - 4-6: Moderately important
   - 1-3: Minor detail
   - 0: Mentioned but not relevant

4. **Consider Context**: If previous summary exists, factor in how it affects the current query's interpretation

5. **Identify Primary Focus**: What is the ONE most important thing the user wants to know?

## Weight Assignment Guidelines
- The main metric/outcome gets highest weight
- Time constraints get high weight if they limit the scope significantly  
- Grouping/filtering dimensions get medium weight
- Modifiers and details get lower weight
- Consider business impact and decision-making value

## Examples
Query: "Show me monthly sales trends for our top 5 products in Q4"
- "monthly sales trends" (weight: 10) - the core request
- "top 5 products" (weight: 8) - important filter/scope
- "Q4" (weight: 7) - important time constraint
- "our" (weight: 2) - company context, assumed

Focus on practical business understanding, not technical database details.`;

export const getSqlGenerationPrompt = (
  parsedQuery: string,
  schema: string,
  previousSummary: string | null
) => `You are an expert SQL query generator. Your task is to convert parsed user queries into valid SQL.

## Parsed User Query
${parsedQuery}

## Database Schema
${schema}

## Previous Context
${previousSummary ? `Previous conversation context: ${previousSummary}` : 'No previous context.'}

## Instructions
1. **Generate SQL**: Create a valid SQL query that answers the user's request using the provided schema
2. **Schema Validation**: Ensure all table names, column names, and relationships exist in the schema
3. **Query Completeness**: 
   - Set \`isPartial: false\` if the query fully addresses the request
   - Set \`isPartial: true\` if some aspects cannot be determined and explain in \`partialReason\`
4. **Error Handling**: 
   - If the schema doesn't contain relevant tables/columns for the query, set \`error\` with explanation
   - If the request is completely incompatible with available data, set \`error\` with explanation
   - When \`error\` is set, make \`sqlQuery\`, \`isPartial\`, and \`partialReason\` all null

## SQL Best Practices
- Use proper JOIN syntax when combining tables
- Include appropriate WHERE clauses for filtering
- Use GROUP BY for aggregations
- Add ORDER BY for sorting when relevant
- Use LIMIT when top N results are requested
- Handle date/time formatting appropriately
- Use proper aggregate functions (COUNT, SUM, AVG, etc.)

## Error Conditions
Set \`error\` only when:
- Required tables don't exist in schema
- Required columns don't exist in any available tables
- Query type is fundamentally incompatible with available data structure
- Schema is completely unrelated to the user's request

## Response Format
Return exactly these 4 fields:
- \`sqlQuery\`: Valid SQL string or null if error
- \`isPartial\`: Boolean indicating completeness or null if error  
- \`partialReason\`: String explaining partial nature or null if complete/error
- \`error\`: String explaining why query cannot be generated or null if successful

Focus on generating executable SQL that directly answers the user's question using the available schema.`;

export const getErrorExplanationPrompt = (
  failedQuery: string,
  errorDetails: string,
  previousSummary: string | null
) => `You are a helpful assistant explaining database query issues to non-technical users.

## Failed Query Context
${failedQuery}

## Technical Error Details
${errorDetails}

## Previous Context
${previousSummary ? `Previous conversation: ${previousSummary}` : 'No previous context.'}

## Your Task
Write a clear, user-friendly explanation in markdown format about why the query couldn't be completed.

## Guidelines
- Use simple, non-technical language
- Don't mention SQL, databases, or technical error codes
- Focus on what the user was trying to do and why it didn't work
- Suggest possible reasons in friendly terms
- Keep it concise but helpful
- Use markdown formatting for better readability

## Example Explanations
- "I couldn't find the specific data you're looking for. The information might not be available in the current dataset."
- "The time period you mentioned doesn't seem to have any matching records. You might want to try a different date range."
- "I'm having trouble understanding what you're looking for. Could you rephrase your question or be more specific?"

## Output Format
Return only the markdown explanation text. No JSON, no schema - just clear, helpful markdown content that explains the issue to the user.

Focus on being helpful and encouraging the user to try again with different parameters or questions.`;

export const getChartConfigPrompt = (
  sqlQuery: string,
  userQueryIntent: string,
  previousSummary: string | null
) => `You are an expert at creating shadcn/recharts visualization configurations based on SQL queries and user intent.

## SQL Query
${sqlQuery}

## User Query Intent  
${userQueryIntent}

## Previous Context
${previousSummary ? `Previous conversation: ${previousSummary}` : 'No previous context.'}

## Your Task
Generate appropriate chart/graph configurations that will best visualize the SQL query results based on the user's intent.

## Chart Categories
**Charts** (type: "chart"): Traditional data visualizations
- **bar**: Categorical comparisons, discrete values, distribution across categories
- **line**: Time series, trends, continuous data progression  
- **area**: Cumulative data, filled regions, volume/magnitude emphasis

**Graphs** (type: "graph"): Specialized visualizations
- **pie**: Proportions, percentages, parts of a whole
- **radar**: Multivariate comparisons, multiple metrics simultaneously
- **radial**: Circular representations, progress indicators, radial comparisons

## Configuration Guidelines

1. **Analyze SQL Structure**: Examine SELECT columns, GROUP BY, aggregations to understand data shape

2. **Map Data Keys**: 
   - **xAxis.dataKey**: Column used for x-axis (usually GROUP BY column or time field)
   - **yAxis.dataKey**: Column used for y-axis (usually aggregated metrics)
   - **components[].dataKey**: Columns that represent different data series

3. **DataSeries Configuration**:
   - Create entries for each data column that will be visualized
   - Use friendly labels derived from column names
   - Assign colors from var(--chart-1) through var(--chart-5)
   - Match property keys to actual SQL column names

4. **Multiple Visuals**: Create separate configurations when:
   - Data contains unrelated groups requiring different chart types
   - Different metrics need different visualization approaches
   - Time-based and categorical data are mixed

5. **Chart Type Selection**:
   - Time series data → line or area charts
   - Category comparisons → bar charts  
   - Proportional data → pie charts
   - Multi-metric comparisons → radar charts
   - Circular/progress data → radial charts

## Example Mapping
SQL: \`SELECT month, desktop_users, mobile_users FROM analytics GROUP BY month\`
- xAxis: { dataKey: "month" }
- yAxis: { dataKey: "desktop_users" } (or create multiple configs)
- dataSeries: { 
    desktop_users: { label: "Desktop Users", color: "var(--chart-1)" },
    mobile_users: { label: "Mobile Users", color: "var(--chart-2)" }
  }
- components: [
    { dataKey: "desktop_users", fill: "var(--chart-1)" },
    { dataKey: "mobile_users", fill: "var(--chart-2)" }
  ]

Focus on creating configurations that accurately represent the SQL query structure while providing meaningful visualizations for the user's intent.`;



export function getSummarizationPrompt(
  userQuery: string,
  userQueryParsed: any,
  sqlResult: any,
  dbResult: any,
  chartResult: any,
  errorResult: any = null
): string {
  return `
You are an AI assistant tasked with summarizing a conversation involving a user query, its parsed form, a generated SQL query, database results, chart configuration, and optional error explanations. Create a concise, natural-language summary that captures the key points of the conversation. Include:
- The user's original query.
- The intent or parsed structure of the query.
- The generated SQL query.
- The outcome of the database execution (e.g., number of rows returned or errors).
- The chart configuration (if any).
- Any error explanations (if applicable).

**Inputs**:
- User Query: ${userQuery}
- Parsed Query: ${JSON.stringify(userQueryParsed)}
- SQL Query: ${sqlResult.sqlQuery}
- Database Result: ${dbResult ? `Rows: ${dbResult.rowCount}, Error: ${dbResult.error || 'None'}` : 'None'}
- Chart Config: ${chartResult ? JSON.stringify(chartResult.chartConfig) : 'None'}
- Error Explanation: ${errorResult ? errorResult : 'None'}

**Instructions**:
- Write a concise summary in natural language.
- Avoid repeating raw JSON unless necessary for clarity.
- Focus on the user's intent, the query's outcome, and any issues encountered.
- Output the summary as a Markdown.
`;
}
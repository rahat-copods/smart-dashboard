import { NextRequest, NextResponse } from "next/server";
import { AIClient } from "@/lib/api/aiClient";
import { executeQuery } from "@/lib/api/dbClient";
import { userSchemas } from "@/lib/api/schema";
import {
  ChartConfigSchema,
  QueryParsingSchema,
  SqlGenerationSchema,
  ErrorReasonSchema,
  SummarySchema,
} from "@/lib/api/outputSchema";
import {
  getChartConfigPrompt,
  getErrorExplanationPrompt,
  getQueryParsingPrompt,
  getSqlGenerationPrompt,
  getSummarizationPrompt,
} from "@/lib/api/systemPrompts";
import {
  ChartConfig,
  DbResult,
  ErrorReasonResult,
  QueryParsingResult,
  SqlGenerationResult,
  StreamCallback,
  SummaryResult,
} from "@/lib/api/types";
import { ChatCompletionMessageParam } from "openai/resources/index";

async function parseUserQuery(
  aiClient: AIClient,
  schemaString: string,
  messages: any[],
  streamCallback: StreamCallback
): Promise<QueryParsingResult> {
  const systemPromptQueryIntent = getQueryParsingPrompt(schemaString);
  streamCallback("Analyzing the Query", "status");
  const userQueryParsed = await aiClient.streamGenerate(
    [{ role: "system", content: systemPromptQueryIntent }, ...messages],
    streamCallback,
    QueryParsingSchema,
    "reasoning"
  );

  streamCallback("Query analysis complete", "status");
  return userQueryParsed;
}

async function generateSqlQuery(
  aiClient: AIClient,
  userQueryParsed: QueryParsingResult,
  schemaString: string,
  messages: ChatCompletionMessageParam[],
  streamCallback: StreamCallback,
  dialect: string
): Promise<SqlGenerationResult> {
  const systemPromptQueryGenerate = getSqlGenerationPrompt(
    schemaString,
    dialect
  );

  streamCallback("Generating Query", "status");

  const sqlResult = await aiClient.streamGenerate(
    [
      { role: "system", content: systemPromptQueryGenerate },
      ...messages.slice(0, -1),
      {
        ...messages[messages.length - 1],
        content: `${messages[messages.length - 1].content}\n\n**Parsed Query**:\n${JSON.stringify({ ...userQueryParsed, reasoning: null , visualConfigs: null}) }`,
      },
    ],
    streamCallback,
    SqlGenerationSchema,
    "reasoning"
  );

  streamCallback("Query generated", "status");
  return sqlResult;
}

async function executeSqlQuery(
  sqlQuery: string,
  dbUrl: string,
  streamCallback: StreamCallback
): Promise<DbResult> {
  streamCallback("Executing Query", "status");
  const dbResult = await executeQuery(sqlQuery, dbUrl);

  if (dbResult.data || dbResult.rowCount > 0) {
    streamCallback(
      `Data Found: Retrieved ${dbResult.rowCount} rows.\n`,
      "status"
    );
  } else {
    streamCallback("Query failed", "status");
  }
  return dbResult;
}

async function explainError(
  aiClient: AIClient,
  sqlQuery: string,
  error: string,
  messages: ChatCompletionMessageParam[],
  streamCallback: StreamCallback
): Promise<ErrorReasonResult> {
  const systemPromptErrorExplanation = getErrorExplanationPrompt();

  streamCallback("Analyzing failure", "status");

  // No outputSchema = free-form response, streams full content
  const errorData = await aiClient.streamGenerate(
    [
      { role: "system", content: systemPromptErrorExplanation },
      ...messages,
      {
        role: "user",
        content: `**SQL Query:** ${sqlQuery}\n\n**Error:** ${error}`,
      },
    ],
    streamCallback,
    ErrorReasonSchema,
    "errorReason"
  );
  return errorData;
}

async function generateChartConfig(
  aiClient: AIClient,
  sqlQuery: string,
  userQueryParsed: QueryParsingResult,
  messages: any[],
  streamCallback: StreamCallback
): Promise<ChartConfig> {
  streamCallback("Generating visuals", "status");
  const systemPromptChartConfig = getChartConfigPrompt();

  const chartResult = await aiClient.streamGenerate(
    [
      { role: "system", content: systemPromptChartConfig },
      ...messages.slice(0, -1),
      {
        ...messages[messages.length - 1],
        content: `${messages[messages.length - 1].content}\n\n**Parsed Query**:\n${JSON.stringify({ ...userQueryParsed, reasoning: null })}\n\n**SQL Query**:\n${sqlQuery}`,
      },
    ],
    streamCallback,
    ChartConfigSchema,
    "reasoning"
  );

  streamCallback("Visuals Generated", "status");
  return chartResult;
}

async function summarizeConversation(
  aiClient: AIClient,
  userQuery: string,
  userQueryParsed: QueryParsingResult,
  sqlResult: SqlGenerationResult,
  dbResult: DbResult | null,
  chartResult: ChartConfig | null,
  errorResult: ErrorReasonResult | null = null,
  messages: any[],
  streamCallback: StreamCallback
): Promise<SummaryResult> {
  const systemPromptSummarization = getSummarizationPrompt(
    userQuery,
    { ...userQueryParsed, reasoning: "null" },
    { ...sqlResult, reasoning: "null" },
    dbResult,
    chartResult && { ...chartResult, reasoning: "null" },
    errorResult
  );

  streamCallback("Summarizing", "status");

  // No outputSchema = free-form response, streams full content
  const summaryData = await aiClient.streamGenerate(
    [{ role: "system", content: systemPromptSummarization }, ...messages],
    streamCallback,
    SummarySchema
  );

  return summaryData;
}

export async function POST(req: NextRequest) {
  const { userId, messages } = await req.json();
  const userSchema = userSchemas[userId]?.schema;
  const dbUrl = userSchemas[userId]?.db_url;
  const userQuery = messages[messages.length - 1].content;

  if (!userSchema || !dbUrl) {
    return new NextResponse("User schema or database URL not found", {
      status: 400,
    });
  }

  const aiClient = new AIClient();
  const schemaString = JSON.stringify(userSchema);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const streamCallback: StreamCallback = (
        text: string,
        type: "status" | "content" | "error" | "usage"
      ) => {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type, text }) + "\n")
        );
      };

      try {
        // Step 1: Query Parsing
        const userQueryParsed = await parseUserQuery(
          aiClient,
          schemaString,
          messages,
          streamCallback
        );
        console.log("\nstep 1 complete");

        // Step 2: SQL Generation (up to 3 attempts)
        let sqlResult: SqlGenerationResult = {
          error: null,
          reasoning: "",
          sqlQuery: null,
          isPartial: null,
          partialReason: null,
          suggestions: [],
        };
        let dbResult = null;
        let attempt = 0;
        const maxAttempts = 3;
        const previousAttempts: {
          query: string | null;
          error: string | null;
        }[] = [];

        while (
          attempt < maxAttempts &&
          (!dbResult?.data || dbResult?.rowCount === 0)
        ) {
          attempt++;

          // Prepare messages for this attempt
          let attemptMessages = [...messages];

          if (attempt > 1) {
            // Add previous attempts' queries and errors
            const previousAttemptInfo = previousAttempts
              .map(
                (prev, index) =>
                  `**Previous Attempt ${index + 1}**:\n` +
                  `Query: ${prev.query || "None"}\n` +
                  `Error: ${prev.error || "None"}`
              )
              .join("\n\n");
            console.log("previousAttemptInfo", previousAttemptInfo);
            attemptMessages = [
              ...messages.slice(0, -1),
              {
                ...messages[messages.length - 1],
                content:
                  `${messages[messages.length - 1].content}\n\n` +
                  `**Parsed Query**:\n${JSON.stringify({ ...userQueryParsed, reasoning: null })}\n\n` +
                  (previousAttemptInfo
                    ? `**Previous Attempts**:\n${previousAttemptInfo}\n\n`
                    : ""),
              },
            ];
          }

          sqlResult = await generateSqlQuery(
            aiClient,
            userQueryParsed,
            schemaString,
            attemptMessages,
            streamCallback,
            dbUrl.split(":")[0]
          );

          // Check if sqlResult contains an error and rest is null
          if (sqlResult.error && !sqlResult.sqlQuery) {
            const summary = await summarizeConversation(
              aiClient,
              userQuery,
              userQueryParsed,
              sqlResult,
              null,
              null,
              { errorReason: sqlResult.error },
              messages,
              streamCallback
            );
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "result",
                  text: JSON.stringify({
                    query: sqlResult,
                    visuals: null,
                    summary: summary.summary,
                    error: null,
                  }),
                })
              )
            );
            controller.close();
            return;
          }

          dbResult = await executeSqlQuery(
            sqlResult.sqlQuery as string,
            dbUrl,
            streamCallback
          );

          // Store this attempt's query and error
          previousAttempts.push({
            query: sqlResult.sqlQuery,
            error:
              dbResult.error ||
              (dbResult.rowCount === 0 ? "0 rows returned" : null),
          });

          if (dbResult.data || dbResult.rowCount > 0) {
            break;
          } else if (attempt < maxAttempts) {
            streamCallback(`Retrying`, "status");
          }
        }
        console.log("\nstep 2 complete");

        // Step 3: Error Explanation (if 3 attempts fail)
        let errorResult = null;
        if (
          dbResult &&
          (!dbResult.data || dbResult.rowCount === 0) &&
          attempt === maxAttempts
        ) {
          // Use the last attempt's messages with all previous attempts
          const finalAttemptMessages = [
            ...messages.slice(0, -1),
            {
              ...messages[messages.length - 1],
              content:
                `${messages[messages.length - 1].content}\n\n` +
                `**Parsed Query**:\n${JSON.stringify({ ...userQueryParsed, reasoning: null })}\n\n` +
                `**Previous Attempts**:\n${previousAttempts
                  .map(
                    (prev, index) =>
                      `Attempt ${index + 1}:\nQuery: ${prev.query || "None"}\nError: ${prev.error || "None"}`
                  )
                  .join("\n\n")}`,
            },
          ];

          errorResult = await explainError(
            aiClient,
            sqlResult?.sqlQuery as string,
            dbResult.error || "0 rows returned",
            finalAttemptMessages,
            streamCallback
          );
          const summary = await summarizeConversation(
            aiClient,
            userQuery,
            userQueryParsed,
            sqlResult,
            dbResult,
            null,
            errorResult,
            messages,
            streamCallback
          );
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "result",
                text: JSON.stringify({
                  query: sqlResult,
                  visuals: null,
                  summary: summary.summary,
                  error: errorResult.errorReason,
                }),
              })
            )
          );
          controller.close();
          return;
        }
        console.log("\nstep 3 complete");

        // Step 4: Chart Config
        const chartResult = await generateChartConfig(
          aiClient,
          sqlResult?.sqlQuery as string,
          userQueryParsed,
          messages,
          streamCallback
        );
        console.log("\nstep 4 complete");

        // Step 5: Summarize Conversation
        const summary = await summarizeConversation(
          aiClient,
          userQuery,
          userQueryParsed,
          sqlResult,
          dbResult,
          chartResult,
          null,
          messages,
          streamCallback
        );
        console.log("\nstep 5 complete");

        // Final response with all relevant data
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "result",
              text: JSON.stringify({
                query: sqlResult,
                visuals: chartResult,
                summary: summary.summary,
                error: null,
                data: dbResult?.data,
              }),
            })
          )
        );
        controller.close();
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error";
        streamCallback(`Error: ${errorMessage}\n`, "error");
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              text: JSON.stringify({
                data: null,
                chartConfig: null,
                sqlQuery: null,
                error: errorMessage,
                summary: null,
              }),
            })
          )
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

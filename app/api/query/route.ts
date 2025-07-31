import { NextRequest, NextResponse } from "next/server";
import { AIClient } from "@/lib/api/aiClient";
import { executeQuery } from "@/lib/api/dbClient";
import { userSchemas } from "@/lib/api/schema";
import {
  chartConfigSchema,
  queryParsingSchema,
  sqlGenerationSchema,
} from "@/lib/api/outputSchema";
import {
  getChartConfigPrompt,
  getErrorExplanationPrompt,
  getQueryParsingPrompt,
  getSqlGenerationPrompt,
  getSummarizationPrompt,
} from "@/lib/api/systemPrompts";

type StreamMarkdown = (text: string, type: 'status' | 'content' | 'partialResult' | 'error') => void;
async function parseUserQuery(
  aiClient: AIClient,
  schemaString: string,
  previousSummary: string | null,
  userQuery: string,
  messages: any[],
  streamMarkdown: StreamMarkdown
) {
  streamMarkdown("Thinking: Preparing to parse query...\n", "status");
  const systemPromptQueryIntent = getQueryParsingPrompt(
    schemaString,
    previousSummary,
    userQuery
  );
  const parsingStream = await aiClient.streamGenerate(
    [{ role: "system", content: systemPromptQueryIntent }, ...messages],
    queryParsingSchema
  );
  let parsingData = "";
  streamMarkdown("Analyzing the Query", "status");
  for await (const chunk of parsingStream) {
    const content = chunk.choices[0]?.delta?.content || "";
    parsingData += content;
    streamMarkdown(content, "content");
  }
  const userQueryParsed = JSON.parse(parsingData);
  streamMarkdown("Analyzed", "status");
  streamMarkdown(JSON.stringify({ userQueryParsed }), "partialResult");
  return userQueryParsed;
}

async function generateSqlQuery(
  aiClient: AIClient,
  userQueryParsed: any,
  schemaString: string,
  previousSummary: string | null,
  messages: any[],
  streamMarkdown: StreamMarkdown,
  attempt: number
) {
  streamMarkdown("Thinking", "status");
  const systemPromptQueryGenerate = getSqlGenerationPrompt(
    userQueryParsed,
    schemaString,
    previousSummary
  );
  const sqlStream = await aiClient.streamGenerate(
    [{ role: "system", content: systemPromptQueryGenerate }, ...messages],
    sqlGenerationSchema
  );
  let sqlData = "";
  streamMarkdown("Generating Query", "status");
  for await (const chunk of sqlStream) {
    const content = chunk.choices[0]?.delta?.content || "";
    sqlData += content;
    streamMarkdown(content, "content");
  }
  const sqlResult = JSON.parse(sqlData);
  streamMarkdown("Generated Query", "status");
  streamMarkdown(JSON.stringify({ sqlResult }), "partialResult");
  return sqlResult;
}

async function executeSqlQuery(
  sqlQuery: string,
  dbUrl: string,
  streamMarkdown: StreamMarkdown
) {
  streamMarkdown("Executing Query", "status");
  const dbResult = await executeQuery(sqlQuery, dbUrl);
  if (dbResult.data || dbResult.rowCount > 0) {
    streamMarkdown(`Data Found: Retrieved ${dbResult.rowCount} rows.\n`, "status");
  } else {
    streamMarkdown("Query failed", "status");
  }
  streamMarkdown(JSON.stringify({ dbResult }), "partialResult");
  return dbResult;
}

async function explainError(
  aiClient: AIClient,
  sqlQuery: string,
  error: string,
  previousSummary: string | null,
  messages: any[],
  streamMarkdown: StreamMarkdown
) {
  streamMarkdown("Thinking", "status");
  const systemPromptErrorExplanation = getErrorExplanationPrompt(
    sqlQuery,
    error,
    previousSummary
  );
  const errorStream = await aiClient.streamGenerate([
    { role: "system", content: systemPromptErrorExplanation },
    ...messages,
  ]);
  let errorData = "";
  streamMarkdown("Analyzing failure", "status");
  for await (const chunk of errorStream) {
    const content = chunk.choices[0]?.delta?.content || "";
    errorData += content;
    streamMarkdown(content, "content");
  }
  streamMarkdown(JSON.stringify({ errorResult: errorData }), "partialResult");
  return errorData;
}

async function generateChartConfig(
  aiClient: AIClient,
  sqlQuery: string,
  userQueryParsed: any,
  previousSummary: string | null,
  messages: any[],
  streamMarkdown: StreamMarkdown
) {
  streamMarkdown("Generate visuals", "status");
  const systemPromptChartConfig = getChartConfigPrompt(
    sqlQuery,
    userQueryParsed,
    previousSummary
  );
  const chartStream = await aiClient.streamGenerate(
    [{ role: "system", content: systemPromptChartConfig }, ...messages],
    chartConfigSchema
  );
  let chartData = "";
  for await (const chunk of chartStream) {
    const content = chunk.choices[0]?.delta?.content || "";
    chartData += content;
    streamMarkdown(content, "content");
  }
  const chartResult = JSON.parse(chartData);
  streamMarkdown("Visuals Generated", "status");
  streamMarkdown(JSON.stringify({ chartResult }), "partialResult");
  return chartResult;
}

async function summarizeConversation(
  aiClient: AIClient,
  userQuery: string,
  userQueryParsed: any,
  sqlResult: any,
  dbResult: any,
  chartResult: any,
  errorResult: any = null,
  messages: any[],
  streamMarkdown: StreamMarkdown
) {
  const systemPromptSummarization = getSummarizationPrompt(
    userQuery,
    userQueryParsed,
    sqlResult,
    dbResult,
    chartResult,
    errorResult
  );
  const summaryStream = await aiClient.streamGenerate(
    [{ role: "system", content: systemPromptSummarization }, ...messages]
  );
  let summaryData = "";
  streamMarkdown("Summarizing", "status");
  for await (const chunk of summaryStream) {
    const content = chunk.choices[0]?.delta?.content || "";
    summaryData += content;
    streamMarkdown(content, "content");
  }
  streamMarkdown(JSON.stringify({ finalSummary: summaryData }), "partialResult");
  return summaryData;
}

export async function POST(req: NextRequest) {
  const { userId, messages } = await req.json();
  const userSchema = userSchemas[userId]?.schema;
  const dbUrl = userSchemas[userId]?.db_url;
  const userQuery = messages[messages.length - 1].content;
  const previousSummary: string | null =
    messages[messages.length - 2]?.content.summary || null;

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
      const streamMarkdown: StreamMarkdown = (text: string, type: 'status' | 'content' | 'partialResult' | 'error') =>
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type, text }) + '\n'
          )
        );

      try {
        // Step 1: Query Parsing
        const userQueryParsed = await parseUserQuery(
          aiClient,
          schemaString,
          previousSummary,
          userQuery,
          messages,
          streamMarkdown
        );
        console.log("\nstep 1 complete");

        // Step 2: SQL Generation (up to 3 attempts)
        let sqlResult;
        let dbResult = null;
        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts && (!dbResult?.data || dbResult?.rowCount === 0)) {
          attempt++;
          sqlResult = await generateSqlQuery(
            aiClient,
            userQueryParsed,
            schemaString,
            previousSummary,
            messages,
            streamMarkdown,
            attempt
          );

          // Check if sqlResult contains an error and rest is null
          if (
            sqlResult.error &&
            !sqlResult.sqlQuery &&
            !sqlResult.table &&
            !sqlResult.columns
          ) {
            const summary = await summarizeConversation(
              aiClient,
              userQuery,
              userQueryParsed,
              sqlResult,
              null,
              null,
              sqlResult.error,
              messages,
              streamMarkdown
            );
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'result',
                  text: JSON.stringify({
                    data: null,
                    chartConfig: null,
                    sqlQuery: null,
                    error: sqlResult.error,
                    finalSummary: summary,
                  })
                })
              )
            );
            controller.close();
            return;
          }

          dbResult = await executeSqlQuery(sqlResult.sqlQuery, dbUrl, streamMarkdown);

          if (dbResult.data || dbResult.rowCount > 0) {
            break;
          } else if (attempt < maxAttempts) {
            streamMarkdown(`Retrying`, "status");
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
          errorResult = await explainError(
            aiClient,
            sqlResult.sqlQuery,
            dbResult.error as string,
            previousSummary,
            messages,
            streamMarkdown
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
            streamMarkdown
          );
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'result',
                text: JSON.stringify({
                  data: null,
                  chartConfig: null,
                  sqlQuery: sqlResult.sqlQuery,
                  error: dbResult.error,
                  finalSummary: summary,
                })
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
          sqlResult.sqlQuery,
          userQueryParsed,
          previousSummary,
          messages,
          streamMarkdown
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
          streamMarkdown
        );
        console.log("\nstep 5 complete");

        // Final response with all relevant data
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'result',
              text: JSON.stringify({
                data: dbResult?.data,
                chartConfig: chartResult.chartConfig,
                sqlQuery: sqlResult.sqlQuery,
                error: dbResult?.error || null,
                finalSummary: summary,
              })
            })
          )
        );
        controller.close();
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error";
        streamMarkdown(`Error: ${errorMessage}\n`, "status");
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'error',
              text: JSON.stringify({
                data: null,
                chartConfig: null,
                sqlQuery: null,
                error: errorMessage,
                finalSummary: `Error occurred: ${errorMessage}`,
              })
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
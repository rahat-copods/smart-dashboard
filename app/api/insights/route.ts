import { NextRequest, NextResponse } from "next/server";
import { AIClient } from "@/lib/api/aiClient";
import { getInsightsPrompt } from "@/lib/api/systemPrompts";
import { userSchemas } from "@/lib/api/schema";
import { ChatCompletionMessageParam } from "openai/resources/index";

type StreamMarkdown = (
  text: string,
  type: "status" | "content" | "partialResult" | "error"
) => void;

async function generateDataInsights(
  aiClient: AIClient,
  schema: string,
  messages: ChatCompletionMessageParam[],
  streamMarkdown: StreamMarkdown
) {
  streamMarkdown("Generating summary...", "status");

  const systemPrompt = getInsightsPrompt(schema);
  const summaryStream = await aiClient.streamGenerate([
    {
      role: "system",
      content: systemPrompt,
    },
    ...messages
  ]);

  let summaryData = "";
  for await (const chunk of summaryStream) {
    const content = chunk.choices[0]?.delta?.content || "";
    summaryData += content;
    streamMarkdown(content, "content");
  }

  streamMarkdown("Summary generated", "status");
  streamMarkdown(JSON.stringify({ summary: summaryData }), "partialResult");
  return summaryData;
}

export async function POST(req: NextRequest) {
  const { userId, messages } = await req.json();

  if (!userId || !messages) {
    return new NextResponse("Input data is required", {
      status: 400,
    });
  }

  const aiClient = new AIClient();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const streamMarkdown: StreamMarkdown = (
        text: string,
        type: "status" | "content" | "partialResult" | "error"
      ) =>
        controller.enqueue(
          encoder.encode(JSON.stringify({ type, text }) + "\n")
        );

      try {
        const userSchema = JSON.stringify(userSchemas[userId]?.schema);
        const summary = await generateDataInsights(
          aiClient,
          userSchema,
          messages,
          streamMarkdown
        );

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "result",
              text: JSON.stringify({
                summary,
                error: null,
              }),
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
              type: "error",
              text: JSON.stringify({
                summary: null,
                error: errorMessage,
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

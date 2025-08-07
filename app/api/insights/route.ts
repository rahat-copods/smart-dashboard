import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index";

import { AIClient } from "@/lib/api/aiClient";
import { getInsightsPrompt } from "@/lib/api/systemPrompts";
import { userSchemas } from "@/lib/api/schema";
import { InsightsResult, StreamCallback } from "@/lib/api/types";
import { InsightsSchema } from "@/lib/api/outputSchema";

async function generateDataInsights(
  aiClient: AIClient,
  schema: string,
  messages: ChatCompletionMessageParam[],
  streamCallback: StreamCallback,
): Promise<InsightsResult> {
  streamCallback("Generating summary...", "status");

  const systemPrompt = getInsightsPrompt(schema);

  const insights = await aiClient.streamGenerate(
    [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
    streamCallback,
    InsightsSchema,
    "insights",
  );

  streamCallback("Summary generated", "status");

  return insights;
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
      const streamCallback: StreamCallback = (
        text: string,
        type: "status" | "content" | "error",
      ) => {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type, text }) + "\n"),
        );
      };

      try {
        const userSchema = JSON.stringify(userSchemas[userId]?.schema);
        const insights = await generateDataInsights(
          aiClient,
          userSchema,
          messages,
          streamCallback,
        );

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "result",
              text: JSON.stringify(insights),
            }),
          ),
        );
        controller.close();
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error";

        streamCallback(`Error: ${errorMessage}\n`, "error");
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              text: errorMessage,
            }),
          ),
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

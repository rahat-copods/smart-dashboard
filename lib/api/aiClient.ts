import { OpenAI } from "openai";
import {
  ChatCompletionMessageParam,
  CompletionUsage,
} from "openai/resources/index";
import { zodResponseFormat } from "openai/helpers/zod";

import { createStreamingParser } from "./streamingUtils";
import { StreamCallback } from "./types";

export class AIClient {
  private client: OpenAI;
  private model: string;
  constructor(apiKey: string, url: string, model: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: url,
    });
    this.model = model;
  }

  async streamGenerate(
    messages: ChatCompletionMessageParam[],
    streamCallback: StreamCallback,
    outputSchema?: any,
    fieldToExtract: string = "reasoning",
  ): Promise<any> {
    console.log("starting AI Stream");
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.1,
      top_p: 0.1,
      stream: true,
      stream_options: { include_usage: true },
      ...(outputSchema
        ? {
            response_format: zodResponseFormat(outputSchema, "query_parsing"),
          }
        : {}),
    });

    let fullData = "";
    let parser = createStreamingParser(fieldToExtract, streamCallback);

    for await (const chunk of stream) {
      if (chunk.choices.length > 0) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          fullData += content;
          parser.processChunk(content);
        }
      } else if ("usage" in chunk) {
        streamCallback(JSON.stringify(chunk.usage as CompletionUsage), "usage");
      }
    }
    console.log("Stream completed");

    return JSON.parse(fullData);
  }
}

import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index";
import { createStreamingParser } from "./streamingUtils";
import { StreamCallback } from "./types";
import { zodResponseFormat } from "openai/helpers/zod";

export class AIClient {
  private client: OpenAI;
  private model: string;
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    });
    this.model = process.env.AI_MODEL_NAME as string;
  }

  async streamGenerate(
    messages: ChatCompletionMessageParam[],
    streamCallback: StreamCallback,
    outputSchema?: any,
    fieldToExtract: string = "reasoning"
  ): Promise<any> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.2,
      top_p: 0.5,
      stream: true,
      ...(outputSchema
        ? {
            response_format: zodResponseFormat(outputSchema, "query_parsing"),
          }
        : {}),
    });

    let fullData = "";
    let parser = createStreamingParser(fieldToExtract, streamCallback);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullData += content;
        parser.processChunk(content);
      }
    }
    return JSON.parse(fullData);
  }
}

import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/index';
import { createStreamingParser } from './streamingUtils';
import { StreamCallback } from './types';

export class AIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
  }

  async streamGenerate(
    messages: ChatCompletionMessageParam[], 
    outputSchema?: { [key: string]: unknown; },
    streamCallback?: StreamCallback,
    fieldToExtract: string = "reasoning"
  ): Promise<any> {
    const stream = await this.client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages,
      temperature: 0.2, 
      top_p: 0.5,
      stream: true,
      ...(outputSchema ? {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_response",
            strict: true,
            schema: outputSchema,
          },
        },
      } : {}),
    });

    let fullData = "";
    let parser: ReturnType<typeof createStreamingParser> | null = null;

    // If we have a streamCallback and outputSchema, use field extraction
    if (streamCallback && outputSchema) {
      parser = createStreamingParser(fieldToExtract, streamCallback);
    }

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullData += content;
        
        if (parser) {
          // Stream specific field
          parser.processChunk(content);
        } else if (streamCallback) {
          // Stream full content
          streamCallback(content, "content");
        }
      }
    }

    // Return the complete parsed JSON
    return JSON.parse(fullData);
  }
}
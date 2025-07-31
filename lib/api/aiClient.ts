import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/index';

export class AIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    });
  }

  async streamGenerate(messages: ChatCompletionMessageParam[], outputSchema?: { [key: string]: unknown; }) {
    const model = process.env.AI_MODEL || 'grok-3-mini';
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature: 0.2, 
      top_p: 0.5,
      stream: true,
      ...(outputSchema ? {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sql_query_response",
            strict: true,
            schema: outputSchema,
          },
        },
      } : {}),
    });

    // Return async iterator for streaming chunks
    return stream;
  }
}
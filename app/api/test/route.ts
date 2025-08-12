export async function GET() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const authToken = process.env.AUTH_TOKEN;
  const envVars = {
    ADMIN_USERNAME: username,
    ADMIN_PASSWORD: password,
    AUTH_TOKEN: authToken,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_MODEL_NAME: process.env.AI_MODEL_NAME,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };

  const results = Object.entries(envVars).map(([keyname, value]) => ({
    keyname,
    exists: value !== undefined && value !== "",
    value: value ? "[REDACTED]" : null, // never leak actual value
  }));

  return new Response(JSON.stringify({ envCheck: results }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const chunks = [
        "Streaming test started...\n",
        "First chunk...\n",
        "Second chunk...\n",
        "Third chunk...\n",
        "Streaming test complete.\n",
      ];

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((res) => setTimeout(res, 500)); // Simulate delay
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

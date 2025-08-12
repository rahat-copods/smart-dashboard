export async function GET() {
  const vars = [
    "AI_MODEL_NAME",
    "AI_BASE_URL",
    "AI_API_KEY",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "AUTH_TOKEN",
    "POSTGRES_URL",
  ];

  const results = vars.map((key) => ({
    key,
    exists: process.env[key] !== undefined && process.env[key] !== "",
    value: process.env[key] ? "[REDACTED]" : null, // Don't leak actual values
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

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
    start(controller) {
      controller.enqueue(encoder.encode("Starting...\n"));

      let i = 0;
      const interval = setInterval(() => {
        i++;
        controller.enqueue(encoder.encode(`Chunk ${i}\n`));

        if (i >= 10) {
          clearInterval(interval);
          controller.enqueue(encoder.encode("Done!\n"));
          controller.close();
        }
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

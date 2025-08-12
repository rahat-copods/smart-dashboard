export const runtime = "nodejs";

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

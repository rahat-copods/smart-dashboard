"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function TestEnvPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [streamOutput, setStreamOutput] = useState("");
  const [dbData, setDbData] = useState<any>(null);

  const checkEnv = async () => {
    setEnvData(null);
    const res = await fetch("/api/test");
    const data = await res.json();

    setEnvData(data);
  };

  const testStream = async () => {
    setStreamOutput("");
    const res = await fetch("/api/test", { method: "POST" });

    if (!res.body) {
      setStreamOutput("No stream body received");

      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      setStreamOutput((prev) => prev + decoder.decode(value, { stream: true }));
    }
  };

  const testDb = async () => {
    setDbData(null);
    const res = await fetch("/api/test-db");
    const data = await res.json();

    setDbData(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Env, Streaming & DB Test</h1>
      <div className="flex gap-2">
        <Button onClick={testStream}>Test Streaming</Button>
        <Button onClick={checkEnv}>Check Env Vars</Button>
        <Button onClick={testDb}>Test DB Connection</Button>
      </div>

      {streamOutput && (
        <pre style={{ marginTop: 20, padding: 10 }}>{streamOutput}</pre>
      )}

      {envData && (
        <pre style={{ marginTop: 20, padding: 10 }}>
          {JSON.stringify(envData, null, 2)}
        </pre>
      )}

      {dbData && (
        <pre style={{ marginTop: 20, padding: 10 }}>
          {JSON.stringify(dbData, null, 2)}
        </pre>
      )}
    </div>
  );
}

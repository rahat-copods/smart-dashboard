import { StreamCallback } from "./types";

interface StreamingState {
  buffer: string;
  inTargetField: boolean;
  fieldContent: string;
  fieldComplete: boolean;
  fullJsonData: string;
}

export function createStreamingParser(
  fieldName: string,
  streamCallback: StreamCallback,
) {
  const state: StreamingState = {
    buffer: "",
    inTargetField: false,
    fieldContent: "",
    fieldComplete: false,
    fullJsonData: "",
  };

  const processChunk = (chunk: string): void => {
    state.fullJsonData += chunk;
    state.buffer += chunk;

    if (!state.inTargetField) {
      checkForFieldStart();
    }

    if (state.inTargetField && !state.fieldComplete) {
      extractFieldContent();
    }
  };

  const checkForFieldStart = (): void => {
    const fieldPattern = `"${fieldName}"`;

    if (state.buffer.includes(fieldPattern)) {
      const fieldStart = state.buffer.indexOf(fieldPattern);
      const colonIndex = state.buffer.indexOf(":", fieldStart);
      const quoteIndex = state.buffer.indexOf('"', colonIndex + 1);

      if (quoteIndex !== -1) {
        state.inTargetField = true;
        state.fieldContent = "";
        state.buffer = state.buffer.substring(quoteIndex + 1);
      }
    }
  };

  const extractFieldContent = (): void => {
    let fieldEnd = -1;
    let escaped = false;

    for (let i = 0; i < state.buffer.length; i++) {
      const char = state.buffer[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        fieldEnd = i;
        break;
      }
    }

    if (fieldEnd !== -1) {
      const finalContent =
        state.fieldContent + state.buffer.substring(0, fieldEnd);
      const remainingContent = finalContent.substring(
        state.fieldContent.length,
      );

      if (remainingContent) {
        const cleanContent = cleanEscapeSequences(remainingContent);

        streamCallback(cleanContent, "content");
      }

      state.fieldComplete = true;
    } else {
      const cleanBuffer = cleanEscapeSequences(state.buffer);

      if (cleanBuffer) {
        streamCallback(cleanBuffer, "content");
      }

      state.fieldContent += state.buffer;
      state.buffer = "";
    }
  };

  const cleanEscapeSequences = (content: string): string => {
    return content
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r");
  };

  return {
    processChunk,
    getFullJsonData: () => state.fullJsonData,
    isComplete: () => state.fieldComplete,
  };
}

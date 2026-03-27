const MCP_URL = "http://localhost:3001";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send messages to the MCP server and stream the response.
 * Calls onChunk for each streamed text chunk, onDone when complete.
 */
export async function streamChat(
  skillId: string,
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  const response = await fetch(`${MCP_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillId, messages }),
  });

  if (!response.ok || !response.body) {
    onError(`Server error: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as {
          type: string;
          text?: string;
        };
        if (event.type === "text" && event.text) {
          onChunk(event.text);
        } else if (event.type === "done") {
          onDone();
        } else if (event.type === "error" && event.text) {
          onError(event.text);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }

  onDone();
}

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function groqChat(options: {
  apiKey: string;
  messages: GroqMessage[];
  model: string;
  maxTokens: number;
  temperature: number;
}) {
  const { apiKey, messages, model, maxTokens, temperature } = options;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "Groq request failed";
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return content as string;
}

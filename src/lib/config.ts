export const config = {
  freeModel: process.env.FREE_MODEL || "llama-3.1-8b-instant",
  freeDailyLimit: Number(process.env.FREE_DAILY_LIMIT ?? "10") || 10,
  freeMaxTokens: Number(process.env.FREE_MAX_TOKENS ?? "512") || 512,
  proMaxTokens: Number(process.env.PRO_MAX_TOKENS ?? "2048") || 2048,
  temperature: Number(process.env.AI_TEMPERATURE ?? "0.3") || 0.3,
};

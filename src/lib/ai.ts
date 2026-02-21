import { createOpenAI } from "@ai-sdk/openai";
import { env } from "~/env";

export const openai = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY,
});

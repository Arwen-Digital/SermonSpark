"use node";

import { v } from "convex/values";
import { markdownToHtml } from "../../utils/markdown";
import { action } from "../_generated/server";
import { historicalContextPrompt } from "../prompts/historicalContext";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";


type HistoricalContextArgs = {
  bible_text: string;
};

type HistoricalContextResult = {
  context: string;
  html: string;
  raw?: unknown;
};

function renderTemplate(template: string, values: HistoricalContextArgs) {
  return template.replace(/\{bible_text\}/g, (match, key) => {
    const value = values.bible_text;
    return value ? value.trim() : "";
  });
}

export const generateHistoricalContext = action({
  args: {
    bible_text: v.string(),
  },
  handler: async (_ctx, args): Promise<HistoricalContextResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!model) {
      throw new Error("Missing OPENROUTER_MODEL environment variable");
    }

    const prompt = renderTemplate(historicalContextPrompt, args);

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();

    const contextText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const context = (contextText as string).trim();

    if (!context) {
      throw new Error("OpenRouter response did not contain any text");
    }

    return {
      context,
      html: markdownToHtml(context),
      raw: data,
    };
  },
});

export type GenerateHistoricalContextAction = typeof generateHistoricalContext;

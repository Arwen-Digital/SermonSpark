"use node";

import { v } from "convex/values";
import { markdownToHtml } from "../../utils/markdown";
import { action } from "../_generated/server";
import { illustrationPrompt } from "../prompts/illustration";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";


type IllustrationArgs = {
  biblical_concept: string;
};

type IllustrationResult = {
  illustration: string;
  html: string;
  raw?: unknown;
};

function renderTemplate(template: string, values: IllustrationArgs) {
  return template.replace(/\{biblical_concept\}/g, (match, key) => {
    const value = values.biblical_concept;
    return value ? value.trim() : "";
  });
}

export const generateIllustration = action({
  args: {
    biblical_concept: v.string(),
  },
  handler: async (_ctx, args): Promise<IllustrationResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!model) {
      throw new Error("Missing OPENROUTER_MODEL environment variable");
    }

    const prompt = renderTemplate(illustrationPrompt, args);

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

    const illustrationText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const illustration = (illustrationText as string).trim();

    if (!illustration) {
      throw new Error("OpenRouter response did not contain any text");
    }

    return {
      illustration,
      html: markdownToHtml(illustration),
      raw: data,
    };
  },
});

export type GenerateIllustrationAction = typeof generateIllustration;

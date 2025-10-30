"use node";

import { v } from "convex/values";
import { readFileSync } from "fs";
import { resolve } from "path";
import { markdownToHtml } from "../../utils/markdown";
import { action } from "../_generated/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";

// Path to prompts directory from convex functions
const TEMPLATE_PATH = resolve(__dirname, "../../prompts/outline_generator.txt");

let promptTemplate = "";

try {
  promptTemplate = readFileSync(TEMPLATE_PATH, "utf8");
} catch (error) {
  console.error("Failed to read outline prompt template:", error);
  throw new Error("Unable to load prompt template");
}

type OutlineArgs = {
  outline_type: string;
  sermon_topic: string;
  bible_verse: string;
  preacher: string;
};

type OutlineResult = {
  outline: string;
  html: string;
  raw?: unknown;
};

function renderTemplate(template: string, values: OutlineArgs) {
  return template.replace(/\{(outline_type|sermon_topic|bible_verse|preacher)\}/g, (match, key) => {
    const value = values[key as keyof OutlineArgs];
    return value ? value.trim() : "";
  });
}

export const generateOutline = action({
  args: {
    outline_type: v.string(),
    sermon_topic: v.string(),
    bible_verse: v.string(),
    preacher: v.string(),
  },
  handler: async (_ctx, args): Promise<OutlineResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!model) {
      throw new Error("Missing OPENROUTER_MODEL environment variable");
    }

    const prompt = renderTemplate(promptTemplate, args);

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

    const outlineText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const outline = (outlineText as string).trim();

    if (!outline) {
      throw new Error("OpenRouter response did not contain any text");
    }

    return {
      outline,
      html: markdownToHtml(outline),
      raw: data,
    };
  },
});

export type GenerateOutlineAction = typeof generateOutline;



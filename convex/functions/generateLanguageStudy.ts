"use node";

import { v } from "convex/values";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { markdownToHtml } from "../../utils/markdown";
import { action } from "../_generated/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_PATH = resolve(__dirname, "../../prompts/language_study.txt");

const defaultTemplate = "Provide a short original language study (greek for new testament and hebrew in the old testament) for {bible_text}";

let promptTemplate = defaultTemplate;

try {
  promptTemplate = readFileSync(TEMPLATE_PATH, "utf8");
} catch (error) {
  console.error("Failed to read language study prompt template, falling back to default", error);
}

type LanguageStudyArgs = {
  bible_text: string;
};

type LanguageStudyResult = {
  study: string;
  html: string;
  raw?: unknown;
};

function renderTemplate(template: string, values: LanguageStudyArgs) {
  return template.replace(/\{bible_text\}/g, (match, key) => {
    const value = values.bible_text;
    return value ? value.trim() : "";
  });
}

export const generateLanguageStudy = action({
  args: {
    bible_text: v.string(),
  },
  handler: async (_ctx, args): Promise<LanguageStudyResult> => {
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

    const studyText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const study = (studyText as string).trim();

    if (!study) {
      throw new Error("OpenRouter response did not contain any text");
    }

    return {
      study,
      html: markdownToHtml(study),
      raw: data,
    };
  },
});

export type GenerateLanguageStudyAction = typeof generateLanguageStudy;

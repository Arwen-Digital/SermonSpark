"use node";

import { v } from "convex/values";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { action } from "../_generated/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_PATH = resolve(__dirname, "../../prompts/sermon_title_generator.txt");

const defaultTemplate = `Generate 10 compelling sermon titles based on this sermon content. Return only a JSON array of strings with no additional text or formatting.

Sermon Content: {sermon_content}
Scripture Reference: {scripture_reference}
Current Title: {current_title}
Tags: {tags}

Requirements:
- Each title should be engaging and clickable
- Mix of emotional, action-oriented, and question formats
- Include 1-2 titles that reference the scripture directly
- Keep titles under 80 characters
- Make them memorable and shareable

JSON Format: ["Title 1", "Title 2", "Title 3", ...]`;

let promptTemplate = defaultTemplate;

try {
  promptTemplate = readFileSync(TEMPLATE_PATH, "utf8");
} catch (error) {
  console.error("Failed to read sermon title generator prompt template, falling back to default", error);
}

type SermonTitleArgs = {
  sermon_content: string;
  scripture_reference: string;
  current_title: string;
  tags: string[];
};

type SermonTitleResult = {
  titles: string[];
  raw?: unknown;
};

function renderTemplate(template: string, values: SermonTitleArgs) {
  return template
    .replace(/\{sermon_content\}/g, (match, key) => {
      const value = values.sermon_content;
      return value ? value.trim() : "";
    })
    .replace(/\{scripture_reference\}/g, (match, key) => {
      const value = values.scripture_reference;
      return value ? value.trim() : "";
    })
    .replace(/\{current_title\}/g, (match, key) => {
      const value = values.current_title;
      return value ? value.trim() : "";
    })
    .replace(/\{tags\}/g, (match, key) => {
      const value = values.tags;
      return Array.isArray(value) ? value.join(", ") : "";
    });
}

function parseTitlesFromResponse(responseText: string): string[] {
  // Try to extract JSON array from the response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
    } catch (error) {
      console.error("Failed to parse JSON from response:", error);
    }
  }

  // Fallback: split by lines and clean up
  const lines = responseText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !line.match(/^(Requirements|format|JSON)/i))
    .map(line => line.replace(/^[\d\-•*]+\s*/, '')) // Remove bullet points and numbers
    .map(line => line.replace(/^"(.*)"$/, '$1')) // Remove surrounding quotes
    .filter(line => line.length > 0);

  // Return up to 10 titles
  return lines.slice(0, 10);
}

export const generateSermonTitles = action({
  args: {
    sermon_content: v.string(),
    scripture_reference: v.string(),
    current_title: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (_ctx, args): Promise<SermonTitleResult> => {
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

    const responseText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    if (!responseText.trim()) {
      throw new Error("OpenRouter response did not contain any text");
    }

    const titles = parseTitlesFromResponse(responseText);

    if (titles.length === 0) {
      throw new Error("No valid titles could be extracted from the response");
    }

    return {
      titles,
      raw: data,
    };
  },
});

export type GenerateSermonTitlesAction = typeof generateSermonTitles;

"use node";

import { v } from "convex/values";
import { markdownToHtml } from "../../utils/markdown";
import { action } from "../_generated/server";
import { topicExplorerPrompt } from "../prompts/topicExplorer";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";

type TopicExplorationArgs = {
  sermon_topic?: string;
  bible_verse?: string;
};

type TopicExplorationResult = {
  exploration: string;
  html: string;
  raw?: unknown;
};

function renderTemplate(template: string, values: TopicExplorationArgs) {
  return template
    .replace(/\{sermon_topic\}/g, values.sermon_topic || "")
    .replace(/\{bible_verse\}/g, values.bible_verse || "");
}

export const generateTopicExploration = action({
  args: {
    sermon_topic: v.optional(v.string()),
    bible_verse: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<TopicExplorationResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!model) {
      throw new Error("Missing OPENROUTER_MODEL environment variable");
    }

    if (!args.sermon_topic && !args.bible_verse) {
      throw new Error("Either sermon_topic or bible_verse must be provided");
    }

    const prompt = renderTemplate(topicExplorerPrompt, args);

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

    const explorationText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const exploration = (explorationText as string).trim();

    if (!exploration) {
      throw new Error("OpenRouter response did not contain any text");
    }

    return {
      exploration,
      html: markdownToHtml(exploration),
      raw: data,
    };
  },
});

export type GenerateTopicExplorationAction = typeof generateTopicExploration;


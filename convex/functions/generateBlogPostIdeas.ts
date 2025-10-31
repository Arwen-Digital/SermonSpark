"use node";

import { v } from "convex/values";
import { markdownToHtml } from "../../utils/markdown";
import { action } from "../_generated/server";
import { blogPostIdeasPrompt } from "../prompts/blogPostIdeas";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";

type BlogPostIdeasArgs = {
  input_type: 'sermon' | 'topic_verse';
  content: string;
  // For sermon-based posts
  sermon_title?: string;
  scripture_reference?: string;
  sermon_content?: string;
  // For topic/verse posts
  topic?: string;
  bible_verse?: string;
};

type BlogPostIdeasResult = {
  ideas: string;
  html: string;
  raw?: unknown;
};

function renderTemplate(template: string, values: BlogPostIdeasArgs) {
  let rendered = template
    .replace(/\{input_type\}/g, values.input_type)
    .replace(/\{content\}/g, values.content);

  if (values.input_type === 'sermon') {
    rendered = rendered
      .replace(/\{if_sermon_content\}/g, '')
      .replace(/\{\/if_sermon_content\}/g, '')
      .replace(/\{sermon_title\}/g, values.sermon_title || '')
      .replace(/\{scripture_reference\}/g, values.scripture_reference || '')
      .replace(/\{sermon_content\}/g, values.sermon_content || '')
      .replace(/\{topic\}/g, '')
      .replace(/\{bible_verse\}/g, '');
  } else {
    rendered = rendered
      .replace(/\{if_sermon_content\}/g, '')
      .replace(/\{\/if_sermon_content\}/g, '')
      .replace(/\{sermon_title\}/g, '')
      .replace(/\{scripture_reference\}/g, '')
      .replace(/\{sermon_content\}/g, '')
      .replace(/\{topic\}/g, values.topic || '')
      .replace(/\{bible_verse\}/g, values.bible_verse || '');
  }

  return rendered;
}

export const generateBlogPostIdeas = action({
  args: {
    input_type: v.union(v.literal("sermon"), v.literal("topic_verse")),
    content: v.string(),
    sermon_title: v.optional(v.string()),
    scripture_reference: v.optional(v.string()),
    sermon_content: v.optional(v.string()),
    topic: v.optional(v.string()),
    bible_verse: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<BlogPostIdeasResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!model) {
      throw new Error("Missing OPENROUTER_MODEL environment variable");
    }

    const prompt = renderTemplate(blogPostIdeasPrompt, args);

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

    const ideasText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const ideas = (ideasText as string).trim();

    if (!ideas) {
      throw new Error("OpenRouter response did not contain any text");
    }

    return {
      ideas,
      html: markdownToHtml(ideas),
      raw: data,
    };
  },
});

export type GenerateBlogPostIdeasAction = typeof generateBlogPostIdeas;


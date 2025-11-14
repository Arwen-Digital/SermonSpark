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

type Citation = {
  id: number;
  url: string;
  title?: string;
  snippet?: string;
};

type TopicExplorationResult = {
  exploration: string;
  html: string;
  citations: Citation[];
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

    const primaryChoice = data?.choices?.[0];
    const message = primaryChoice?.message;

    const messageContent = message?.content;

    const collectedCitations: Citation[] = [];
    const citationByKey = new Map<string, Citation>();

    const addCitation = (incoming: Partial<Citation> & { id?: number | string }) => {
      if (!incoming) {
        return;
      }

      const id = Number(incoming.id);
      const url = incoming.url ?? "";
      if (!url) {
        return;
      }

      const key = `${id || ""}|${url}`;

      if (citationByKey.has(key)) {
        return;
      }

      const citation: Citation = {
        id: Number.isFinite(id) && id > 0 ? id : collectedCitations.length + 1,
        url,
        title: incoming.title,
        snippet: incoming.snippet,
      };

      citationByKey.set(key, citation);
      collectedCitations.push(citation);
    };

    const messageCitationsCandidates =
      message?.metadata?.citations ??
      message?.citations ??
      (Array.isArray(messageContent)
        ? messageContent.find(
            (item: any) =>
              item && typeof item === "object" && item.type === "citations"
          )?.citations
        : undefined);

    if (Array.isArray(messageCitationsCandidates)) {
      messageCitationsCandidates.forEach((citation: any, index: number) => {
        if (!citation) {
          return;
        }

        const base = citation.url_citation ?? citation;

        addCitation({
          id: citation.id ?? base?.id ?? index + 1,
          url:
            base?.url ??
            base?.source ??
            base?.metadata?.url ??
            citation.url ??
            citation.source ??
            "",
          title:
            base?.title ??
            base?.metadata?.title ??
            citation.title ??
            citation.source ??
            undefined,
          snippet:
            base?.snippet ??
            base?.text ??
            base?.passage ??
            citation.snippet ??
            citation.text ??
            undefined,
        });
      });
    }

    const annotations =
      primaryChoice?.annotations ??
      message?.annotations ??
      data?.annotations ??
      [];
    if (Array.isArray(annotations)) {
      annotations.forEach((annotation: any, index: number) => {
        const payload = annotation?.url_citation ?? annotation?.citation ?? annotation;
        if (!payload) {
          return;
        }

        addCitation({
          id: payload.id ?? index + 1,
          url: payload.url ?? payload.source ?? "",
          title: payload.title ?? payload.metadata?.title ?? undefined,
          snippet: payload.snippet ?? payload.text ?? payload.passage ?? undefined,
        });
      });
    }

    const primaryChoiceCitations = primaryChoice?.citations ?? data?.citations;
    if (Array.isArray(primaryChoiceCitations)) {
      primaryChoiceCitations.forEach((citation: any, index: number) => {
        if (!citation) {
          return;
        }

        if (typeof citation === "string") {
          addCitation({
            id: index + 1,
            url: citation,
            title: citation,
          });
          return;
        }

        addCitation({
          id: citation.id ?? index + 1,
          url: citation.url ?? citation.source ?? "",
          title: citation.title ?? citation.metadata?.title ?? undefined,
          snippet: citation.snippet ?? citation.text ?? undefined,
        });
      });
    }

    collectedCitations.sort((a, b) => a.id - b.id);
    const normalizedCitations: Citation[] = collectedCitations.map((citation, idx) => ({
      ...citation,
      id: idx + 1,
    }));

    const explorationText =
      primaryChoice?.text ??
      (typeof messageContent === "string"
        ? messageContent
        : Array.isArray(messageContent)
        ? messageContent
            .filter(
              (item: any) =>
                item &&
                typeof item === "object" &&
                (item.type === "output_text" || item.type === "text")
            )
            .map((item: any) => item.text ?? item.content ?? "")
            .join("\n")
        : "") ??
      data?.data?.[0]?.text ??
      "";

    const exploration = (explorationText as string).trim();

    if (!exploration) {
      throw new Error("OpenRouter response did not contain any text");
    }

    const citationPlaceholders = new Map<
      string,
      { label: string; url: string; id: number }
    >();
    let placeholderIndex = 0;

    const markdownWithPlaceholders = normalizedCitations.length
      ? exploration.replace(/\[(\d+)(:[^\]]+)?\]/g, (match, number: string, suffix: string) => {
          const citation = normalizedCitations.find((item) => item.id === Number(number));
          if (!citation?.url) {
            return match;
          }

          const suffixText = suffix ?? "";
          const label = `[${number}${suffixText}]`;
          const placeholder = `__CITATION_PLACEHOLDER_${placeholderIndex++}__`;
          citationPlaceholders.set(placeholder, {
            label,
            url: citation.url,
            id: citation.id,
          });
          return placeholder;
        })
      : exploration;

    let html = markdownToHtml(markdownWithPlaceholders);

    citationPlaceholders.forEach(({ label, url }, placeholder) => {
      const replacement = `<sup class="citation"><a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a></sup>`;
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(escapedPlaceholder, "g"), replacement);
    });

    return {
      exploration,
      html,
      citations: normalizedCitations,
      raw: data,
    };
  },
});

export type GenerateTopicExplorationAction = typeof generateTopicExploration;


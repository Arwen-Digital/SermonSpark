"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/completions";

// Keep translations explicit to align with client options
// type Translation = "ESV" | "KJV" | "CSB" | "NLT" | "NIV";

interface FetchVerseArgs {
  reference: string;
  translation: "ESV" | "KJV" | "CSB" | "NLT" | "NIV";
}

interface FetchVerseResult {
  reference: string;
  translation: FetchVerseArgs["translation"];
  text: string;
  raw: any;
  cached?: boolean;
}

export const fetchVerse = action({
  args: {
    reference: v.string(),
    translation: v.union(
      v.literal("ESV"),
      v.literal("KJV"),
      v.literal("CSB"),
      v.literal("NLT"),
      v.literal("NIV")
    ),
  },
  handler: async (ctx, { reference, translation }): Promise<FetchVerseResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!model) {
      throw new Error("Missing OPENROUTER_MODEL environment variable");
    }

    // Cache key (normalize reference spacing/case)
    const key = `${reference.trim().toLowerCase()}|${translation}`;
    const cached: { text?: string } | null = await ctx.runQuery(api.bibleCache.getByKey, { key });
    if (cached?.text) {
      return { reference, translation, text: cached.text, raw: null, cached: true };
    }

    // Create prompt for OpenRouter
    const prompt = `You are a Bible verse lookup assistant. Provide the exact text of the Bible verse ${reference} from the ${translation} (${translation} translation) Bible.

Requirements:
- Return ONLY the verse text itself, word-for-word from the ${translation} Bible
- Do not include verse numbers in the text
- Do not include the book name, chapter, or reference
- Do not add any commentary, explanation, or additional context
- If the reference includes a verse range (e.g., "John 3:16-17"), provide all verses in that range
- Maintain the exact wording and punctuation from the ${translation} translation
- Return plain text only, no formatting, markdown, or special characters

Bible Reference: ${reference}
Translation: ${translation}

Verse Text:`;

    // Fetch with timeout and retries
    const maxAttempts = 3;
    const baseDelayMs = 500;
    const timeoutMs = 12000; // 12 seconds
    let lastError: any = null;
    let data: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
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
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
        }

        data = await response.json();
        break; // Success, exit retry loop
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;
        console.error(`OpenRouter attempt ${attempt}/${maxAttempts} failed:`, error instanceof Error ? error.message : String(error));

        // If not the last attempt, wait before retrying with exponential backoff
        if (attempt < maxAttempts) {
          const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // If all retries failed, try to return cached result as fallback
    if (!data) {
      console.error(`All ${maxAttempts} OpenRouter attempts failed for ${reference} (${translation})`);
      
      // Return cached result if available
      if (cached?.text) {
        console.log(`Returning cached verse as fallback for ${reference} (${translation})`);
        return {
          reference,
          translation,
          text: cached.text,
          raw: null,
          cached: true,
        };
      }

      // No cache available, throw error
      throw new Error(
        `Failed to fetch Bible verse after ${maxAttempts} attempts. ${lastError instanceof Error ? lastError.message : String(lastError)}`
      );
    }

    const verseText =
      data?.choices?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      data?.data?.[0]?.text ||
      "";

    const text = (verseText as string).trim();

    if (!text) {
      // If response has no text but we have cached result, return it
      if (cached?.text) {
        console.log(`Returning cached verse as fallback - API returned empty text for ${reference} (${translation})`);
        return {
          reference,
          translation,
          text: cached.text,
          raw: null,
          cached: true,
        };
      }
      throw new Error("OpenRouter response did not contain any text");
    }

    const result = {
      reference,
      translation,
      text,
      raw: data,
    };

    // Store in cache only if the response doesn't look like an error
    const hasErrorField = data && typeof data === "object" && (data.error || data.errors);
    const looksLikeErrorText = /error|invalid|not found|failed/i.test(text ?? "");
    const shouldCache = !hasErrorField && !looksLikeErrorText && !!(text && text.trim().length > 0);
    if (shouldCache) {
      try {
        await ctx.runMutation(api.bibleCache.upsert, {
          key,
          reference,
          translation,
          text,
        });
      } catch {}
    }

    return result;
  },
});



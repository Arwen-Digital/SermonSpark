import { v } from "convex/values";
import { action } from "./_generated/server";

// Keep translations explicit to align with client options
// type Translation = "ESV" | "KJV" | "CSB" | "NLT" | "NIV";

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
  handler: async (_ctx, { reference, translation }) => {
    if (!process.env.EDENAI_API_KEY) {
      throw new Error("Missing EDENAI_API_KEY");
    }

    const url = "https://api.edenai.run/v2/prompts/Bible-Text";
    const word = `${reference} ${translation}`; // e.g., "jn 3:16 CSB"

    async function callEden(promptKey: string) {
      const payload = {
        // Try both casings for compatibility
        promptContext: { [promptKey]: word },
        prompt_context: { [promptKey]: word },
        params: { temperature: 1, stream: false },
      } as const;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EDENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      return res;
    }

    // Try common variable names used by prompts
    const keysToTry = ["word", "text", "input", "verse", "query", "reference"];
    let lastErrorText = "";
    let res: Response | null = null;
    for (const key of keysToTry) {
      const attempt = await callEden(key);
      if (attempt.ok) {
        res = attempt;
        break;
      }
      lastErrorText = await attempt.text();
      // Only keep trying if it's a missing context error; otherwise stop early
      if (!lastErrorText.toLowerCase().includes("missing context")) {
        throw new Error(`EdenAI error ${attempt.status}: ${lastErrorText}`);
      }
    }

    if (!res) {
      throw new Error(`EdenAI error 400: ${lastErrorText || "Failed to satisfy prompt context"}`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error("Failed to parse EdenAI response as JSON");
    }

    // EdenAI responses may vary; try common fields and fall back to stringifying
    const textFields = [
      data?.generated_text,
      data?.result,
      data?.output,
      typeof data === "string" ? data : undefined,
    ].filter(Boolean);

    const text = (textFields[0] as string | undefined) ?? JSON.stringify(data);

    return {
      reference,
      translation,
      text,
      raw: data,
    };
  },
});



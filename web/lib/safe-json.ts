/**
 * Parse AI model output into JSON safely.
 * Handles code fences, extra wrapper text, and truncated JSON.
 */
export function safeJsonParse(raw: string): Record<string, unknown> {
  let cleaned = (raw || "").trim();

  if (!cleaned) {
    throw new Error("Empty AI response");
  }

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  // If output contains prose around JSON, extract the first JSON object block.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    let repaired = cleaned;
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let prev = "";

    for (const ch of repaired) {
      if (ch === '"' && prev !== "\\") inString = !inString;
      if (!inString) {
        if (ch === "{") braces++;
        if (ch === "}") braces--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
      }
      prev = ch;
    }

    if (inString) repaired += '"';
    while (brackets > 0) {
      repaired += "]";
      brackets--;
    }
    while (braces > 0) {
      repaired += "}";
      braces--;
    }

    try {
      return JSON.parse(repaired);
    } catch {
      console.error("safeJsonParse failed. Raw snippet:", raw.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please try again.");
    }
  }
}

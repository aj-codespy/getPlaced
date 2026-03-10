/**
 * Parse AI model output into JSON safely.
 * Handles code fences, extra wrapper text, and truncated JSON.
 */
export function safeJsonParse(raw: string): Record<string, unknown> {
  let cleaned = (raw || "").trim();

  if (!cleaned) {
    throw new Error("Empty AI response");
  }

  // Remove BOM/control chars often returned by model transports.
  cleaned = cleaned
    .replace(/^\uFEFF/, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  // Normalize smart quotes to plain JSON quotes.
  cleaned = cleaned
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // If output contains prose around JSON, extract a balanced top-level block.
  cleaned = extractJsonBlock(cleaned);

  try {
    return coerceToRecord(JSON.parse(cleaned));
  } catch {
    let repaired = cleaned;

    // Common malformed JSON cleanup:
    // 1) Remove trailing commas before } or ]
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");
    // 2) Escape lone backslashes that break JSON.parse
    repaired = repaired.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

    // 3) Close truncated string/containers if response was cut off.
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
      return coerceToRecord(JSON.parse(repaired));
    } catch {
      console.error("safeJsonParse failed. Raw snippet:", raw.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please try again.");
    }
  }
}

function extractJsonBlock(input: string): string {
  const firstObj = input.indexOf("{");
  const firstArr = input.indexOf("[");
  const starts = [firstObj, firstArr].filter(i => i >= 0);
  if (starts.length === 0) return input;

  const start = Math.min(...starts);
  const opener = input[start];
  const closer = opener === "[" ? "]" : "}";

  let depth = 0;
  let inString = false;
  let prev = "";
  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"' && prev !== "\\") inString = !inString;
    if (!inString) {
      if (ch === opener) depth++;
      if (ch === closer) depth--;
      if (depth === 0) return input.slice(start, i + 1);
    }
    prev = ch;
  }

  // If not balanced, still return from first opener onward for repair pass.
  return input.slice(start);
}

function coerceToRecord(parsed: unknown): Record<string, unknown> {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new Error("AI returned invalid JSON object");
}

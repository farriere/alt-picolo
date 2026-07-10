import type { Question } from "../types";

/**
 * Extracts a Google Sheet ID from a full URL or returns the string as-is if
 * it already looks like a bare ID.
 */
export function extractSheetId(urlOrId: string): string {
  const match = urlOrId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Fetches questions from a public Google Sheet using the Google Visualization
 * Query API, which supports CORS for publicly shared sheets.
 *
 * The sheet must have:
 *   Column A — prompt text  (may contain [1], [2] … player placeholders)
 *   Column B — category name
 */
export async function fetchQuestionsFromSheet(
  sheetId: string,
): Promise<Question[]> {
  const id = extractSheetId(sheetId);
  if (!id) throw new Error("No Google Sheet ID provided.");

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "Network error — check your internet connection or verify the sheet is public.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sheet (HTTP ${response.status}). Is the sheet public?`,
    );
  }

  const csv = await response.text();
  const questions = parseCSV(csv);

  if (questions.length === 0) {
    throw new Error(
      "The sheet appears to be empty. Add prompts to column A and categories to column B.",
    );
  }

  return questions;
}

function parseCSV(csv: string): Question[] {
  const lines = csv.trim().split("\n");
  const questions: Question[] = [];

  for (const line of lines.slice(1)) {
    // skip header row
    const fields = parseCSVLine(line);
    const prompt = fields[0]?.trim() ?? "";
    const category = fields[1]?.trim() ?? "";
    if (prompt) {
      questions.push({ prompt, category });
    }
  }

  return questions;
}

/** Parses a single CSV line, respecting RFC 4180 double-quote escaping. */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  result.push(field);
  return result;
}

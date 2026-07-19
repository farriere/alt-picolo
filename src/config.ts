/** Sheet ID sourced from VITE_GOOGLE_SHEET_ID in .env, overrideable at runtime via Setup. */
export const DEFAULT_SHEET_ID: string =
  (import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined) ?? "";

export const LS_SHEET_KEY = "picolo_sheet_id";
export const MIN_PLAYERS = 2;

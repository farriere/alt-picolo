/** Sheet ID from build-time env variable — can be overridden at runtime via the Setup screen. */
export const DEFAULT_SHEET_ID: string =
  (import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined) ?? "";

export const LS_SHEET_KEY = "Sheet1";
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

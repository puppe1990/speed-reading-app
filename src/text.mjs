export const TECHNIQUES = ["chunking", "peripheral", "rsvp", "sweep"];

export const DEFAULT_TECHNIQUE = "chunking";
export const DEFAULT_WPM = 450;
export const MIN_WPM = 100;
export const MAX_WPM = 1000;
export const DEFAULT_CHUNK_SIZE = 3;
export const DEFAULT_FONT_SIZE = 1.15;
export const MIN_FONT_SIZE = 0.7;
export const MAX_FONT_SIZE = 2;

// Settings that follow the reader across every text (persisted per user).
export const DEFAULT_PREFERENCES = {
  wpm: DEFAULT_WPM,
  technique: DEFAULT_TECHNIQUE,
  chunkSize: DEFAULT_CHUNK_SIZE,
  fontSize: DEFAULT_FONT_SIZE,
  guideLines: true,
  blurAdjacents: true,
};

// Content saved as plain text; a blank line starts a new paragraph. Single
// newlines are only treated as breaks when the whole text has no blank line,
// so pasted articles still split sensibly.
export function splitParagraphs(content) {
  const raw = String(content ?? "").replace(/\r\n/g, "\n");
  let chunks = raw.split(/\n\s*\n/);
  if (chunks.length === 1) chunks = raw.split(/\n+/);
  return chunks
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function clampWpm(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_WPM;
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(number)));
}

export function clampChunkSize(value) {
  const number = Math.round(Number(value));
  return [2, 3, 4].includes(number) ? number : DEFAULT_CHUNK_SIZE;
}

export function clampFontSize(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_FONT_SIZE;
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, number));
}

export function isTechnique(value) {
  return TECHNIQUES.includes(value);
}

export function techniqueOrDefault(value) {
  return isTechnique(value) ? value : DEFAULT_TECHNIQUE;
}

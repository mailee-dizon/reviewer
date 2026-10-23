// Small helpers for tidying text that comes from the APIs.

// Shortens text to at most maxLength characters, cutting after the last full sentence
// that fits, or between words (with "…") if there isn't one.
export function shortenText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (lastSentenceEnd > 80) return cut.slice(0, lastSentenceEnd + 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

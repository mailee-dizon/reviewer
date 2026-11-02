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

// Just the letters and digits of a name, in lowercase, e.g. "J. K. Rowling" becomes "jkrowling".
// Lets names written with or without dots and spaces match.
export function nameLetters(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

// Checks whether two names are the same apart from a typo or two, e.g. "jk rowlling" and
// "J. K. Rowling". Longer names are allowed a few more mistakes.
export function isCloseName(a: string, b: string): boolean {
  const first = nameLetters(a);
  const second = nameLetters(b);
  const allowed = Math.max(1, Math.floor(Math.max(first.length, second.length) / 6));
  return editDistance(first, second) <= allowed;
}

// How many letters must be added, removed, or changed to turn one word into the other.
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const change = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + change);
    }
    previous = current;
  }
  return previous[b.length];
}

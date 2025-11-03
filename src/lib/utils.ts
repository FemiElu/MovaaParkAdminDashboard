export function cn(
  ...inputs: Array<string | number | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Normalize a string for forgiving comparisons: lower-case, trim, remove punctuation
 */
export function normalizeString(input?: string | null): string {
  if (!input) return "";
  return input
    .toString()
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics when pre-normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

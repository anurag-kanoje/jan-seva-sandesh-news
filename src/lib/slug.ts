/**
 * Generate a URL-friendly slug from a title string.
 * Handles Hindi/Unicode by stripping non-alphanumeric chars (keeping hyphens).
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\u0900-\u097F-]/g, "") // keep alphanumeric, Hindi chars, hyphens
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function generateUniqueSlug(title: string): string {
  const base = generateSlug(title);
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

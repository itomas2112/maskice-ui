// src/lib/slug.ts
export const typeToSlug = (t: string) =>
  t.toLowerCase(); // "Case" -> "case", "Glass" -> "glass"

export const slugToType = (s: string): string =>
  s.toLowerCase() === "glass" ? "Glass" : "Case";

export const phoneToSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

export const slugToPhone = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\bplus\b/g, "+")
    .replace(/\biphone\b/i, "iPhone") // tweak as needed
    .replace(/\bpro\b/i, "Pro")
    .replace(/\bmax\b/i, "Max");

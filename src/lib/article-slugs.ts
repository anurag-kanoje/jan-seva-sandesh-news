export const LEGACY_ARTICLE_SLUGS: Record<string, string> = {
  "प्राइवेट-स्कूलों-की-rte-गैर-सहयोग-पर-सवाल-शिक्षा-अधिकार-कानून-पर-टकराव-क्यों-22-अप्रैल-से-जारी-मामला-6r1cm":
    "rte-private-schools-education-row",
};

export const getCanonicalArticleSlug = (slug?: string | null) => {
  if (!slug) return "";
  const decoded = decodeURIComponent(slug);
  return LEGACY_ARTICLE_SLUGS[decoded] || decoded;
};

export const cleanArticleTitle = (title: string) => title.replace(/^#+\s*/, "").trim();
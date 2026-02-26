const viewedArticles = new Set<string>();

export function hasViewedArticle(articleId: string): boolean {
  return viewedArticles.has(articleId);
}

export function markArticleViewed(articleId: string): void {
  viewedArticles.add(articleId);
}

let lastSubmitTime = 0;

export function canSubmitArticle(): boolean {
  const now = Date.now();
  if (now - lastSubmitTime < 5000) return false;
  lastSubmitTime = now;
  return true;
}

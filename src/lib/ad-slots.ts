export const AD_SLOTS = [
  { value: "home-top", label: "होम पेज - ऊपर" },
  { value: "home-mid", label: "होम पेज - बीच में" },
  { value: "home-sidebar", label: "होम पेज - साइडबार" },
  { value: "article-top", label: "लेख - ऊपर" },
  { value: "article-bottom", label: "लेख - नीचे" },
  { value: "category-top", label: "श्रेणी पेज - ऊपर" },
] as const;

export type AdSlotValue = (typeof AD_SLOTS)[number]["value"];

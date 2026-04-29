import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  canonical?: string;
  noIndex?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE_NAME = "जन सेवा संदेश";
const DEFAULT_TITLE = "जन सेवा संदेश - सच्चाई की आवाज़";
const DEFAULT_DESC =
  "जन सेवा संदेश - स्थानीय से वैश्विक स्तर तक निष्पक्ष समाचार। श्री नन्देश्वर शिक्षा एवं जनसेवा संस्थान।";

const SEOHead = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  image,
  url,
  type = "website",
  canonical,
  noIndex = false,
  publishedAt,
  updatedAt,
  author,
  jsonLd,
}: SEOHeadProps) => {
  const pageUrl =
    canonical || url || (typeof window !== "undefined" ? window.location.href : undefined);
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow,max-image-preview:large" />
      )}
      {pageUrl && <link rel="canonical" href={pageUrl} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:locale" content="hi_IN" />
      {type === "article" && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === "article" && updatedAt && (
        <meta property="article:modified_time" content={updatedAt} />
      )}
      {type === "article" && author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {ldArray.map((data, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;

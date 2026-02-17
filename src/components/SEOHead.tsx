import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SEOHead = ({
  title = "जन सेवा संदेश - सच्चाई की आवाज़",
  description = "जन सेवा संदेश - स्थानीय से वैश्विक स्तर तक निष्पक्ष समाचार। श्री नन्देश्वर शिक्षा एवं जनसेवा संस्थान।",
  image,
  url,
}: SEOHeadProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {image && <meta property="og:image" content={image} />}
    {url && <meta property="og:url" content={url} />}
    <meta property="og:type" content="article" />
  </Helmet>
);

export default SEOHead;

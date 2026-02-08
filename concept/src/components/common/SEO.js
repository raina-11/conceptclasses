import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Concept Classes';
const SITE_URL = 'https://conceptinstitute.co.in';
const DEFAULT_OG_IMAGE = `${SITE_URL}/concept-logo.png`;
const TITLE_SUFFIX = 'Concept Classes - Best IIT-JEE & NEET Coaching in Bikaner';

const SEO = ({
  title,
  description,
  keywords,
  canonicalPath = '/',
  ogImage = DEFAULT_OG_IMAGE,
  schemaMarkup,
  noindex = false,
}) => {
  const fullTitle = title ? `${title} | ${TITLE_SUFFIX}` : TITLE_SUFFIX;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Geo Tags */}
      <meta name="geo.region" content="IN-RJ" />
      <meta name="geo.placename" content="Bikaner" />
      <meta name="geo.position" content="28.0229;73.3119" />
      <meta name="ICBM" content="28.0229, 73.3119" />

      {/* JSON-LD Schema */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

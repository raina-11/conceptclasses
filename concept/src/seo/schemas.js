const SITE_URL = 'https://conceptinstitute.co.in';

export function createBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function createCourseSchema(name, description, eligibility) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Concept Classes',
      sameAs: SITE_URL,
    },
    ...(eligibility && {
      coursePrerequisites: eligibility,
    }),
  };
}

export function createFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function createWebPageSchema(name, description, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Concept Classes',
      url: SITE_URL,
    },
  };
}

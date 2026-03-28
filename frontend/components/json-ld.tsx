interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(company: {
  name: string;
  description?: string;
  logoURL?: string;
  contacts?: { website?: string; email?: string };
  industry?: string;
  foundedYear?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.description,
    ...(company.logoURL?.startsWith('http') ? { logo: company.logoURL } : {}),
    ...(company.contacts?.website ? { url: company.contacts.website } : {}),
    ...(company.industry ? { industry: company.industry } : {}),
    ...(company.foundedYear ? { foundingDate: String(company.foundedYear) } : {}),
  };
}

export function jobPostingJsonLd(opportunity: {
  title: string;
  description?: string;
  city?: string;
  workFormat?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  deadline?: string;
}, companyName: string) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: opportunity.title,
    description: opportunity.description || opportunity.title,
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
    },
    datePosted: new Date().toISOString().split('T')[0],
  };

  if (opportunity.city) {
    ld.jobLocation = {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: opportunity.city },
    };
  }
  if (opportunity.workFormat === 'remote') {
    ld.jobLocationType = 'TELECOMMUTE';
  }
  if (opportunity.salaryMin || opportunity.salaryMax) {
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: opportunity.salaryCurrency || 'KZT',
      value: {
        '@type': 'QuantitativeValue',
        ...(opportunity.salaryMin ? { minValue: opportunity.salaryMin } : {}),
        ...(opportunity.salaryMax ? { maxValue: opportunity.salaryMax } : {}),
        unitText: 'MONTH',
      },
    };
  }
  if (opportunity.deadline) {
    ld.validThrough = opportunity.deadline;
  }

  return ld;
}

export function educationalOrgJsonLd(school: {
  name: string;
  description?: string;
  logoURL?: string;
  contacts?: { website?: string };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: school.name,
    description: school.description,
    ...(school.logoURL?.startsWith('http') ? { logo: school.logoURL } : {}),
    ...(school.contacts?.website ? { url: school.contacts.website } : {}),
  };
}

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.com';
const API_URL = process.env.BACKEND_URL || 'http://93.183.87.152:8080';

async function fetchIDs(path: string, key: string): Promise<number[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data[key] ?? []).map((item: { id: number }) => item.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [companyIds, schoolIds, careerPathIds] = await Promise.all([
    fetchIDs('/companies', 'companies'),
    fetchIDs('/schools', 'schools'),
    fetchIDs('/career-paths', 'data'),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/jobs`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/internships`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/hackathons`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/career-paths`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/interview`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/schools`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/masters`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/project-ideas`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/internship-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/suggest`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/legal`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  const companyPages: MetadataRoute.Sitemap = companyIds.map(id => ({
    url: `${BASE_URL}/companies/${id}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const schoolPages: MetadataRoute.Sitemap = schoolIds.map(id => ({
    url: `${BASE_URL}/schools/${id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const careerPathPages: MetadataRoute.Sitemap = careerPathIds.map(id => ({
    url: `${BASE_URL}/career-paths/${id}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...companyPages, ...schoolPages, ...careerPathPages];
}

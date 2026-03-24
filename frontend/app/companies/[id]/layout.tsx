import type { Metadata } from 'next';

const backendUrl = process.env.BACKEND_URL || 'http://93.183.87.152:8080';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${backendUrl}/api/v1/companies/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Компания' };
    const data = await res.json();
    const company = data.company;
    return {
      title: company.name,
      description: company.description || `Стажировки и вакансии в ${company.name} — Jarlyq`,
      openGraph: {
        title: `${company.name} | Jarlyq`,
        description: company.description || `Стажировки и вакансии в ${company.name}`,
      },
    };
  } catch {
    return { title: 'Компания' };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

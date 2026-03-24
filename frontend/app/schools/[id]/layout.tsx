import type { Metadata } from 'next';

const backendUrl = process.env.BACKEND_URL || 'http://93.183.87.152:8080';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${backendUrl}/api/v1/schools/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Школа' };
    const data = await res.json();
    const school = data.school;
    return {
      title: school.name,
      description: school.description || `Курсы и обучение в ${school.name} — Jarlyq`,
      openGraph: {
        title: `${school.name} | Jarlyq`,
        description: school.description || `IT-курсы в ${school.name}`,
      },
    };
  } catch {
    return { title: 'Школа' };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

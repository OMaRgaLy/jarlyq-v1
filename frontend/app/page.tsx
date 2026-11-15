import { redirect } from 'next/navigation';

// The catalog is the product: the first thing a visitor sees is the list of internships.
export default function Page() {
  redirect('/internships');
}

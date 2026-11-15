import { redirect } from 'next/navigation';

// Technologies are now a search filter on the Companies and Schools pages, not a section of their own.
export default function Page() {
  redirect('/companies');
}

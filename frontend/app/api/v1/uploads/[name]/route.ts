// Serves uploaded pictures through Next.js instead of a plain rewrite.
//
// The backend can sit behind a free ngrok tunnel. For requests that look like they come from a
// browser, ngrok answers with an HTML warning page, and an <img> would show up broken.
// Here the server asks for the file itself and sends the header that skips that page.

const BACKEND = process.env.BACKEND_URL || 'http://93.183.87.152:8080';
const NAME = /^[a-f0-9]{32}\.(png|jpg|gif|webp)$/;

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  if (!NAME.test(params.name)) return new Response('Not found', { status: 404 });

  const upstream = await fetch(`${BACKEND}/api/v1/uploads/${params.name}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
    cache: 'no-store',
  }).catch(() => null);

  const type = upstream?.headers.get('content-type') ?? '';
  if (!upstream || !upstream.ok || !type.startsWith('image/')) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      // File names are random and never reused, so they can be cached for good.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

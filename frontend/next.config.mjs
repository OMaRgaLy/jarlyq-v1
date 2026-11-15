/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://93.183.87.152:8080';
    // "fallback" runs only when no page or route handler matched, so app/api/v1/uploads/[name]
    // (which adds the header ngrok needs) wins over this generic proxy.
    return {
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${backendUrl}/api/v1/:path*`,
        },
      ],
    };
  }
};
export default nextConfig;

import type { NextConfig } from 'next';

const lanHost = process.env.PUBLIC_HOST ?? '192.168.1.249';
const apiProxyTarget =
  process.env.API_PROXY_TARGET?.trim() ||
  process.env.NEXT_PUBLIC_API_PROXY_TARGET?.trim() ||
  'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    `http://${lanHost}:3000`,
    `http://${lanHost}`,
    'http://localhost:3000',
  ],
  async redirects() {
    return [
      {
        source: '/print/oil-sale/:id',
        destination: '/oil-sale/:id',
        permanent: false,
      },
    ];
  },
  /**
   * When the browser hits Next directly (:3000) with relative `/api/v1`,
   * forward API + Socket.IO to Nest. Nginx can still override these paths.
   * Note: WS upgrade through Next rewrites is best-effort — client also
   * falls back to `:3001` directly.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiProxyTarget}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;

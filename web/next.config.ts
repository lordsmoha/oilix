import type { NextConfig } from 'next';

const lanHost = process.env.PUBLIC_HOST ?? '192.168.1.249';

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
};

export default nextConfig;

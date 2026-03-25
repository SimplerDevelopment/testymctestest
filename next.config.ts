import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow simplerdevelopment.com to iframe this site (for the visual editor)
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' simplerdevelopment.com *.simplerdevelopment.com localhost:*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

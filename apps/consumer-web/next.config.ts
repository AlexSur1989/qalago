import type { NextConfig } from 'next';
import path from 'node:path';

const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ??
  'http://localhost:3002';

function apiHostname(): string {
  try {
    return new URL(apiOrigin).hostname;
  } catch {
    return 'localhost';
  }
}

const publicOrigin = process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL?.trim();
let publicHostname: string | undefined;
if (publicOrigin) {
  try {
    publicHostname = new URL(publicOrigin).hostname;
  } catch {
    publicHostname = undefined;
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/uploads/**' },
      { protocol: 'http', hostname: apiHostname(), pathname: '/uploads/**' },
      ...(publicHostname
        ? [{ protocol: 'https' as const, hostname: publicHostname, pathname: '/uploads/**' }]
        : []),
    ],
  },
  async rewrites() {
    return [{ source: '/uploads/:path*', destination: `${apiOrigin}/uploads/:path*` }];
  },
};

export default nextConfig;

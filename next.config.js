// Cloudflare Pages adapter (optional - only loaded when available)
try {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  if (process.env.NODE_ENV === 'development') {
    setupDevPlatform().catch(() => {});
  }
} catch (_) {
  // @cloudflare/next-on-pages not available - running in standard Node.js mode
}

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  webpack(config, { dev, isServer }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    // Exclude Node.js-only modules from edge/client bundles
    // better-sqlite3 uses native bindings that cannot run in Cloudflare Workers
    config.externals = [
      ...(config.externals || []),
      ({ request }, callback) => {
        const nodeOnly = ['better-sqlite3', 'fs', 'path', 'os', 'crypto', 'child_process'];
        if (nodeOnly.some((m) => request === m || request?.startsWith(m + '/'))) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ];
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

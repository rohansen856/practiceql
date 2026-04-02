import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16. `sql.js` is resolved via
  // its `browser` export condition, so no Node.js polyfills are needed here.
  turbopack: {},
  // Kept for `next dev --webpack` / `next build --webpack` so `sql.js` can
  // still load in the browser when explicitly opting into webpack.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;

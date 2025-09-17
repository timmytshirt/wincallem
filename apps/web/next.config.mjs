const backend = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    if (!backend) return [];
    return [
      // proxy ONLY your FastAPI endpoints
      { source: '/api/odds/:path*',   destination: `${backend}/odds/:path*` },
      { source: '/api/secure/:path*', destination: `${backend}/secure/:path*` },
      // DO NOT proxy /api/auth/* (NextAuth), /api/stripe/*, /api/healthz if those live in Next
    ];
  },
};

export default config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail builds on lint warnings/errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

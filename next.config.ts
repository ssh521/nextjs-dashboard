import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Laravel API와의 통신을 위한 설정
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
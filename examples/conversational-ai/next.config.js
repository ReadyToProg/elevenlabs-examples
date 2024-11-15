/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Додаємо підтримку .js файлів
    config.resolve.extensions.push('.js');
    return config;
  }
}

module.exports = nextConfig 
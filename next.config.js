/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Remove i18n config as it conflicts with App Router
  // App Router handles internationalization differently
}

module.exports = nextConfig 
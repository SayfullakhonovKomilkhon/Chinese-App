/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [], // Remove localhost restriction for production
  },
  // Remove i18n config as it conflicts with App Router
  // App Router handles internationalization differently
}

module.exports = nextConfig 
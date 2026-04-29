/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  basePath: '/tianjin',
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig

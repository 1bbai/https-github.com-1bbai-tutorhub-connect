/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint is not part of this lean marketing project's toolchain.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Using default image config - deviceSizes and qualities from defaults
  // will be deep-frozen on Vercel via serverFilesManifest -> loadManifest() -> deepFreeze()
}

module.exports = nextConfig

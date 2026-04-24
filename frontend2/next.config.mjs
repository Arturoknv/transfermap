/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.shields.io" },
    ],
  },
};

export default nextConfig;

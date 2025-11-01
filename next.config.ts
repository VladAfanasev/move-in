import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Enable standalone output for Docker runtime image
  // This produces .next/standalone with the minimal server and node_modules
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig

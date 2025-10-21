import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Enable standalone output for Docker runtime image
  // This produces .next/standalone with the minimal server and node_modules
  output: "standalone",
  images: {
    domains: ["picsum.photos", "images.unsplash.com"],
  },
}

export default nextConfig

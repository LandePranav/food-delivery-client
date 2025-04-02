import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;

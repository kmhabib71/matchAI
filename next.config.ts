import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "randomuser.me",
      "images.unsplash.com",
      "robohash.org",
      "picsum.photos",
      "via.placeholder.com",
      "placehold.co",
    ],
  },
};

export default nextConfig;

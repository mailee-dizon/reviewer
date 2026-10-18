import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the Next.js <Image> component load the sample cover photos,
  // which are hosted on Unsplash (the same images used in our Figma prototype),
  // and the real movie posters from OMDb, which are hosted on Amazon.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },

  // Tells Next.js to run our CSS through Tailwind.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

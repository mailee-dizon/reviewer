import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the Next.js <Image> component load the cover images: movie and show posters
  // from TMDB, book covers from Google Books, game covers from IGDB, and fallback
  // photos from Unsplash for items without a cover.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "images.igdb.com" },
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

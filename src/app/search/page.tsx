import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Search" };

// The Search page ("/search"). Placeholder for now.
export default function SearchPage() {
  return (
    <PlaceholderPage
      eyebrow="FIND YOUR NEXT FAVORITE"
      title="Search"
      links={[
        { label: "Go to Movies", href: "/movies" },
        { label: "Go to Shows", href: "/shows" },
        { label: "Go to Books", href: "/books" },
        { label: "Go to Games", href: "/games" },
      ]}
    />
  );
}

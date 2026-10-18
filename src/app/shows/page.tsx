import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Shows" };

// The Shows page ("/shows"). Placeholder for now.
export default function ShowsPage() {
  return (
    <PlaceholderPage
      eyebrow="BROWSE"
      title="TV Shows"
      links={[
        { label: "Go to Movies", href: "/movies" },
        { label: "Go to Books", href: "/books" },
        { label: "Go to Games", href: "/games" },
      ]}
    />
  );
}

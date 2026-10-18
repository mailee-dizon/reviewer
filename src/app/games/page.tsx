import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Games" };

// The Games page ("/games"). Placeholder for now.
export default function GamesPage() {
  return (
    <PlaceholderPage
      eyebrow="BROWSE"
      title="Video Games"
      links={[
        { label: "Go to Movies", href: "/movies" },
        { label: "Go to Shows", href: "/shows" },
        { label: "Go to Books", href: "/books" },
      ]}
    />
  );
}

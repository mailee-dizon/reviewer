import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Books" };

// The Books page ("/books"). Placeholder for now.
export default function BooksPage() {
  return (
    <PlaceholderPage
      eyebrow="BROWSE"
      title="Books"
      links={[
        { label: "Go to Movies", href: "/movies" },
        { label: "Go to Shows", href: "/shows" },
        { label: "Go to Games", href: "/games" },
      ]}
    />
  );
}

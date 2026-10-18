// "use client" is needed because this button reacts to clicks and
// remembers what the visitor saved in their browser.
"use client";

import { BookmarkIcon } from "@/components/Icons";
import { useStored, writeStored } from "@/lib/browserStorage";

// Where the list of saved item slugs is kept.
const libraryKey = "rewind:library";
const emptyLibrary: string[] = [];

type SaveToLibraryButtonProps = {
  slug: string;
};

export default function SaveToLibraryButton({ slug }: SaveToLibraryButtonProps) {
  const library = useStored(libraryKey, emptyLibrary);
  const isSaved = library.includes(slug);

  function toggleSaved() {
    const updated = isSaved ? library.filter((saved) => saved !== slug) : [...library, slug];
    writeStored(libraryKey, updated);
  }

  return (
    <button
      type="button"
      onClick={toggleSaved}
      aria-pressed={isSaved}
      className={`inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-medium transition hover:-translate-y-px ${
        isSaved
          ? "border border-periwinkle bg-lavender-soft text-navy hover:bg-lavender"
          : "bg-navy text-cream hover:bg-navy-hover"
      }`}
    >
      <BookmarkIcon filled={isSaved} />
      {isSaved ? "Saved to your library" : "Save to your library"}
    </button>
  );
}

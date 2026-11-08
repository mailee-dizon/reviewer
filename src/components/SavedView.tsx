// "use client" is needed because saved items are loaded for whoever is signed in.
"use client";

import ButtonLink from "@/components/ButtonLink";
import SavedLists from "@/components/SavedLists";
import { useLibrary } from "@/lib/library";

// The Saved page: the signed-in user's own lists.
export default function SavedView() {
  const library = useLibrary();

  if (library.loading) {
    return <p className="font-serif text-xl text-navy-soft">Loading your library…</p>;
  }

  if (!library.userId) {
    return (
      <div className="max-w-[600px]">
        <p className="mb-8 font-serif text-xl leading-normal text-navy-soft">
          Sign in to keep track of what you&apos;re watching, reading, and playing.
        </p>
        <ButtonLink href="/login?next=%2Fsaved">Sign in</ButtonLink>
      </div>
    );
  }

  return (
    <>
      {library.error && (
        <p className="mb-8 rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{library.error}</p>
      )}
      <SavedLists
        saved={library.entries}
        emptyText={(noun) => `Nothing here yet. Use the Save button on any ${noun} to add it.`}
      />
    </>
  );
}

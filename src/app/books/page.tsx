import type { Metadata } from "next";
import EntertainmentCard from "@/components/EntertainmentCard";
import { getAllBooks } from "@/lib/googleBooks";

export const metadata: Metadata = { title: "Books" };

// The Books page ("/books"): our hand-picked books from Google Books, highest rated first.
export default async function BooksPage() {
  const books = await getAllBooks();

  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">BROWSE</p>
      <h1 className="mb-10 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">Books</h1>

      {books.length === 0 ? (
        <p className="max-w-[600px] font-serif text-xl leading-normal text-navy-soft">
          Books couldn&apos;t be loaded right now. Please try again later.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] sm:gap-x-[22px] sm:gap-y-10">
          {/* Two cards per row on phones; on wider screens, as many as fit. */}
          {books.map((book) => (
            <EntertainmentCard key={book.slug} item={book} />
          ))}
        </div>
      )}
    </main>
  );
}

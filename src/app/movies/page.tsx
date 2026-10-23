import type { Metadata } from "next";
import EntertainmentCard from "@/components/EntertainmentCard";
import { getAllMovies } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Movies" };

// The Movies page ("/movies"): the movies trending on TMDB this week.
export default async function MoviesPage() {
  const movies = await getAllMovies();

  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">BROWSE</p>
      <h1 className="mb-10 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">Movies</h1>

      {movies.length === 0 ? (
        <p className="max-w-[600px] font-serif text-xl leading-normal text-navy-soft">
          Movies couldn&apos;t be loaded right now. Please try again later.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-x-[22px] gap-y-10">
          {movies.map((movie) => (
            <EntertainmentCard key={movie.slug} item={movie} />
          ))}
        </div>
      )}
    </main>
  );
}

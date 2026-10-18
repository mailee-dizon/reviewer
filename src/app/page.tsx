import ButtonLink from "@/components/ButtonLink";
import CategorySection from "@/components/CategorySection";
import { SearchIcon } from "@/components/Icons";
import { homeCategories } from "@/data/entertainment";

// The Home page ("/"): a welcome section followed by one row per category.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-14 sm:px-[clamp(24px,5vw,76px)] sm:pt-20">
      {/* Welcome section */}
      <section className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
            WHAT PEOPLE ARE LOVING
          </p>
          <h1 className="mb-5 max-w-[720px] text-[clamp(48px,6vw,78px)] leading-[0.98] tracking-[-0.035em]">
            Stories worth making time for.
          </h1>
          <p className="max-w-[600px] font-serif text-[19px] leading-normal text-navy-soft">
            Discover, track, and review the movies, shows, books, and games that stay with you.
            See what is trending across every shelf, screen, and world.
          </p>
        </div>
        <ButtonLink href="/search">
          <SearchIcon /> Explore
        </ButtonLink>
      </section>

      {/* One section for each category: Movies, TV Shows, Books, Video Games */}
      {homeCategories.map((category) => (
        <CategorySection key={category} category={category} />
      ))}
    </main>
  );
}

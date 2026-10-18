import Link from "next/link";
import EntertainmentCard from "@/components/EntertainmentCard";
import { ArrowIcon } from "@/components/Icons";
import { categoryInfo, getItemsByCategory, type Category } from "@/data/entertainment";

// One "Trending now" row on the Home page, like "Movies" or "Books".
// Shows a heading, a "View all" link, and a row of cards.

type CategorySectionProps = {
  category: Category;
};

export default async function CategorySection({ category }: CategorySectionProps) {
  const info = categoryInfo[category];
  const sectionItems = await getItemsByCategory(category);

  return (
    <section className="mb-16">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
            TRENDING NOW
          </p>
          <h2 className="text-[31px] leading-tight">{info.sectionTitle}</h2>
        </div>
        <Link
          href={info.href}
          className="flex items-center gap-1.5 whitespace-nowrap py-1 text-[13px] text-periwinkle transition-all hover:gap-2.5"
        >
          View all {info.label.toLowerCase()} <ArrowIcon />
        </Link>
      </div>

      {/* Cards scroll sideways if there isn't enough room to show them all. */}
      <div className="card-row flex snap-x snap-mandatory gap-[22px] overflow-x-auto px-0.5 pb-5 pt-0.5">
        {sectionItems.map((item) => (
          <div key={item.slug} className="w-[170px] flex-none snap-start sm:w-[210px]">
            <EntertainmentCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

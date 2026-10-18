import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, StarIcon } from "@/components/Icons";
import ReviewsSection from "@/components/ReviewsSection";
import SaveToLibraryButton from "@/components/SaveToLibraryButton";
import { categoryInfo, getItemBySlug, items } from "@/data/entertainment";
import { movieIds } from "@/lib/omdb";

// The detail page for one item, e.g. /item/blue-hours.
// The folder name [slug] means this one file handles every item:
// whatever is in the address after /item/ is passed in as "slug".

type DetailPageProps = {
  // In this version of Next.js, params arrive as a Promise, so we "await" them.
  params: Promise<{ slug: string }>;
};

// Tells Next.js the slugs we know about, so those detail pages can be built ahead of time.
// Other movies still work: visiting /item/<any IMDb ID> loads that movie from OMDb.
export function generateStaticParams() {
  const movieSlugs = movieIds.map((id) => ({ slug: id }));
  return [...items.map((item) => ({ slug: item.slug })), ...movieSlugs];
}

// Sets the browser tab title to the item's name.
export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  return { title: item ? item.title : "Not found" };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { slug } = await params;
  const item = await getItemBySlug(slug);

  // If someone types an address that doesn't match any item, show the 404 page.
  if (!item) {
    notFound();
  }

  const info = categoryInfo[item.category];

  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-10 sm:px-[clamp(24px,5vw,76px)]">
      <Link
        href={info.href}
        className="mb-10 inline-flex items-center gap-2 text-[15px] text-periwinkle transition-all hover:gap-3"
      >
        <ArrowLeftIcon /> Back to {info.label.toLowerCase()}
      </Link>

      <div className="grid items-center gap-10 md:grid-cols-[minmax(240px,420px)_1fr] md:gap-[clamp(48px,8vw,100px)]">
        {/* Cover image */}
        <div className="relative aspect-[4/5.35] w-full max-w-[300px] overflow-hidden rounded-[20px] bg-lavender shadow-[0_20px_50px_rgba(23,35,61,0.16)] md:max-w-none">
          <Image
            src={item.image}
            alt={`${item.title} cover`}
            fill
            sizes="(min-width: 768px) 420px, 300px"
            className="object-cover saturate-[.75]"
            priority
          />
        </div>

        {/* Title and info */}
        <div>
          <p className="mb-4 text-[13px] font-semibold tracking-[0.17em] text-periwinkle">
            {info.tag}
            {item.genre && ` · ${item.genre}`}
          </p>
          <h1 className="mb-6 text-[clamp(43px,6vw,82px)] leading-[0.98] tracking-[-0.03em]">
            {item.title}
          </h1>
          <div className="mb-8 flex items-center gap-2.5 text-[17px] text-navy-soft">
            <span>{item.year}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="text-star">
                <StarIcon size={18} />
              </span>
              {item.rating} average
            </span>
          </div>
          {item.description && (
            <p className="mb-9 max-w-[640px] font-serif text-[clamp(21px,2.4vw,29px)] leading-[1.4] text-navy-soft">
              {item.description}
            </p>
          )}

          <SaveToLibraryButton slug={item.slug} />

          {item.about && (
            <div className="mt-10 max-w-[640px] border-t border-line pt-7">
              <p className="mb-3 text-[12px] font-semibold tracking-[0.14em] text-periwinkle">
                ABOUT THIS TITLE
              </p>
              <p className="text-base leading-relaxed text-muted">{item.about}</p>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection item={item} noun={info.tag.toLowerCase()} />
    </main>
  );
}

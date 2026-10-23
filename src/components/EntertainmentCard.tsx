import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@/components/Icons";
import SaveToLibraryButton from "@/components/SaveToLibraryButton";
import { categoryInfo, type EntertainmentItem } from "@/data/entertainment";

// One poster card: cover image, category tag, title, year, and rating.
// The cover and title link to that item's detail page.

type EntertainmentCardProps = {
  item: EntertainmentItem;
  // A bigger tag, slightly larger text, and a "Save" button next to the title, for the Search page.
  large?: boolean;
};

export default function EntertainmentCard({ item, large = false }: EntertainmentCardProps) {
  if (large) {
    return (
      <div className="min-w-0">
        <Link href={`/item/${item.slug}`} className="group block">
          <Cover item={item} sizes="210px" large />
        </Link>
        <div className="px-0.5 pt-3">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/item/${item.slug}`} className="min-w-0">
              <h3 className="truncate text-lg leading-tight transition hover:text-periwinkle">
                {item.title}
              </h3>
            </Link>
            <SaveToLibraryButton item={item} size="small" />
          </div>
          <YearAndRating item={item} className="mt-1.5 text-[13px]" starSize={14} />
        </div>
      </div>
    );
  }

  return (
    <Link href={`/item/${item.slug}`} className="group block min-w-0">
      <Cover item={item} sizes="210px" large={false} />

      {/* Title, year, and rating under the image. */}
      <div className="px-0.5 pt-3">
        <h3 className="truncate text-base leading-tight transition group-hover:text-periwinkle">
          {item.title}
        </h3>
        <YearAndRating item={item} className="mt-1.5 text-[11px]" starSize={13} />
      </div>
    </Link>
  );
}

// The cover image with the category tag in the corner ("large" makes the tag bigger).
// It zooms slightly when its link (marked "group") is hovered.
function Cover({ item, sizes, large }: { item: EntertainmentItem; sizes: string; large: boolean }) {
  return (
    <div className="relative aspect-[4/5.5] w-full overflow-hidden rounded-[13px] bg-lavender shadow-[0_5px_15px_rgba(23,35,61,0.1)]">
      <Image
        src={item.image}
        alt={`${item.title} cover`}
        fill
        sizes={sizes}
        className="object-cover saturate-[.72] transition duration-300 group-hover:scale-[1.035] group-hover:saturate-[.92]"
      />
      <span
        className={`absolute rounded-full bg-paper/90 font-semibold uppercase tracking-[0.08em] text-navy ${
          large ? "left-3 top-3 px-2.5 py-1 text-[10px]" : "left-2.5 top-2.5 px-2 py-1 text-[8px]"
        }`}
      >
        {categoryInfo[item.category].tag}
      </span>
    </div>
  );
}

// The year on the left and the star rating on the right.
// Both are hidden when unknown (0), e.g. some books have no ratings.
function YearAndRating({
  item,
  className,
  starSize,
}: {
  item: EntertainmentItem;
  className: string;
  starSize: number;
}) {
  return (
    <div className={`flex items-center justify-between text-muted ${className}`}>
      <span>{item.year > 0 && item.year}</span>
      {item.rating > 0 && (
        <span className="flex items-center gap-1">
          <span className="text-star">
            <StarIcon size={starSize} />
          </span>
          {item.rating}
        </span>
      )}
    </div>
  );
}

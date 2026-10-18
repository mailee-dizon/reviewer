import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@/components/Icons";
import { categoryInfo, type EntertainmentItem } from "@/data/entertainment";

// One poster card: cover image, category tag, title, year, and rating.
// The whole card is a link to that item's detail page.

type EntertainmentCardProps = {
  item: EntertainmentItem;
};

export default function EntertainmentCard({ item }: EntertainmentCardProps) {
  return (
    <Link href={`/item/${item.slug}`} className="group block min-w-0">
      {/* Cover image. "relative" lets the image and tag sit inside this box. */}
      <div className="relative aspect-[4/5.5] w-full overflow-hidden rounded-[13px] bg-lavender shadow-[0_5px_15px_rgba(23,35,61,0.1)]">
        <Image
          src={item.image}
          alt={`${item.title} cover`}
          fill
          sizes="210px"
          className="object-cover saturate-[.72] transition duration-300 group-hover:scale-[1.035] group-hover:saturate-[.92]"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-paper/90 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-navy">
          {categoryInfo[item.category].tag}
        </span>
      </div>

      {/* Title, year, and rating under the image. */}
      <div className="px-0.5 pt-3">
        <h3 className="truncate text-base leading-tight transition group-hover:text-periwinkle">
          {item.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
          <span>{item.year}</span>
          <span className="flex items-center gap-1">
            <span className="text-star">
              <StarIcon size={13} />
            </span>
            {item.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}

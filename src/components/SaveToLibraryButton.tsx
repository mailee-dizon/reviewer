// "use client" is needed because these buttons react to clicks and
// remember what the visitor saved in their browser.
"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkIcon, CheckIcon } from "@/components/Icons";
import type { EntertainmentItem } from "@/data/entertainment";
import { setSavedStatus, statusLabels, useLibrary, type SavedStatus } from "@/lib/library";

type SaveToLibraryButtonProps = {
  item: EntertainmentItem;
  // "large" shows all three lists as buttons, for detail pages.
  // "small" is a "Save" link that opens a menu, for cards.
  size?: "large" | "small";
};

export default function SaveToLibraryButton({ item, size = "large" }: SaveToLibraryButtonProps) {
  return size === "small" ? <SaveMenu item={item} /> : <StatusButtons item={item} />;
}

// One button per list, e.g. "Want to watch", "Watching", "Watched".
// Clicking the selected one again removes the item from the library.
function StatusButtons({ item }: { item: EntertainmentItem }) {
  const library = useLibrary();
  const current = library[item.slug]?.status;
  const labels = statusLabels[item.category];

  return (
    <div role="group" aria-label="Save to your library" className="flex flex-wrap gap-2.5">
      {/* Shown in the order people usually go through them. */}
      {(["want", "current", "finished"] as const).map((status) => {
        const isSelected = current === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => setSavedStatus(library, item, isSelected ? null : status)}
            aria-pressed={isSelected}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium transition hover:-translate-y-px ${
              isSelected
                ? "bg-navy text-cream hover:bg-navy-hover"
                : "border border-periwinkle text-navy hover:bg-lavender-soft"
            }`}
          >
            {isSelected ? <CheckIcon size={16} /> : <BookmarkIcon size={16} />}
            {labels[status]}
          </button>
        );
      })}
    </div>
  );
}

// A small "Save" link that opens a menu of lists. Once saved, it shows the list's name.
function SaveMenu({ item }: { item: EntertainmentItem }) {
  const library = useLibrary();
  const current = library[item.slug]?.status;
  const labels = statusLabels[item.category];
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when the visitor clicks somewhere else or presses Escape.
  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function choose(status: SavedStatus | null) {
    setSavedStatus(library, item, status);
    setIsOpen(false);
  }

  const optionStyles = "block w-full px-4 py-2 text-left text-[13px] transition hover:bg-lavender-soft";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap py-1 text-[13px] transition ${
          current ? "text-periwinkle" : "text-navy-soft hover:text-navy"
        }`}
      >
        {current ? <CheckIcon size={15} /> : <BookmarkIcon size={15} />}
        {current ? labels[current] : "Save"}
      </button>

      {/* Opens upward, over the cover, so scrolling card rows don't cut it off. */}
      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-10 mb-1 w-40 overflow-hidden rounded-xl border border-line bg-paper py-1.5 shadow-[0_12px_30px_rgba(23,35,61,0.14)]"
        >
          {(["want", "current", "finished"] as const).map((status) => (
            <button
              key={status}
              type="button"
              role="menuitemradio"
              aria-checked={current === status}
              onClick={() => choose(status)}
              className={`${optionStyles} ${current === status ? "font-semibold text-periwinkle" : "text-navy"}`}
            >
              {labels[status]}
            </button>
          ))}
          {current && (
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(null)}
              className={`${optionStyles} mt-1 border-t border-line pt-2.5 text-muted`}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

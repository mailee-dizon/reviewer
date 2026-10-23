// "use client" is needed because saved items live in the visitor's browser,
// and the tabs react to clicks.
"use client";

import { useState } from "react";
import EntertainmentCard from "@/components/EntertainmentCard";
import { categoryInfo, type Category } from "@/data/entertainment";
import { savedStatuses, statusTitles, useLibrary } from "@/lib/library";

// The tabs, in the same order as the navigation bar.
const tabs: Category[] = ["book", "movie", "show", "game"];

// The Saved page: one tab per kind of item. Each tab shows that kind's three lists,
// e.g. "Currently watching", "Watched", and "Want to watch", most recently saved first.
export default function SavedView() {
  const library = useLibrary();
  const [tab, setTab] = useState<Category>(tabs[0]);

  const entries = Object.values(library).sort((a, b) => b.savedAt - a.savedAt);
  const tabEntries = entries.filter((entry) => entry.item.category === tab);

  return (
    <>
      <div role="tablist" aria-label="Kinds of media" className="mb-12 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((category) => {
          const isActive = category === tab;
          const count = entries.filter((entry) => entry.item.category === category).length;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(category)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 pb-4 pt-2 text-[17px] transition ${
                isActive
                  ? "border-navy font-semibold text-navy"
                  : "border-transparent text-navy-soft hover:text-navy"
              }`}
            >
              {categoryInfo[category].label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive ? "bg-lavender text-navy" : "bg-lavender-soft text-navy-soft"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={categoryInfo[tab].label}>
        {savedStatuses.map((status) => {
          const listEntries = tabEntries.filter((entry) => entry.status === status);
          return (
            <section key={status} className="mb-14">
              <div className="mb-5 flex items-baseline gap-3 border-b border-line pb-3">
                <h2 className="text-[31px] leading-tight">{statusTitles[tab][status]}</h2>
                <span className="text-sm text-muted">{listEntries.length}</span>
              </div>
              {listEntries.length === 0 ? (
                <p className="pb-5 text-[15px] text-muted">
                  Nothing here yet. Use the Save button on any {categoryInfo[tab].tag.toLowerCase()} to add it.
                </p>
              ) : (
                // One row of cards that scrolls sideways, like the Home page.
                <div className="card-row flex snap-x snap-mandatory gap-[22px] overflow-x-auto px-0.5 pb-5 pt-0.5">
                  {listEntries.map((entry) => (
                    <div key={entry.item.slug} className="w-[170px] flex-none snap-start sm:w-[210px]">
                      <EntertainmentCard item={entry.item} large />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

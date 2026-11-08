// "use client" is needed because the search box reacts to typing.
"use client";

import { useEffect, useState } from "react";
import PersonRow from "@/components/PersonRow";
import { SearchIcon } from "@/components/Icons";
import { getFollowing, searchProfiles, type Profile } from "@/lib/people";
import { useUser } from "@/lib/supabase";

// How long to wait after the last key press before searching, in milliseconds.
const typingDelay = 300;

// The Find people page: a search box for usernames and names. Before searching, it shows
// the people the signed-in user follows.
export default function PeopleSearch() {
  const { user } = useUser();
  const [text, setText] = useState("");
  const [results, setResults] = useState<Profile[] | null>(null);
  const [following, setFollowing] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");

  // Search a moment after the visitor stops typing.
  useEffect(() => {
    if (!text.trim()) return;
    let isCurrent = true;
    const timer = setTimeout(() => {
      searchProfiles(text)
        .then((found) => isCurrent && setResults(found))
        .catch((caught: Error) => isCurrent && setError(caught.message));
    }, typingDelay);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [text]);

  useEffect(() => {
    if (!user) return;
    getFollowing(user.id)
      .then(setFollowing)
      .catch((caught: Error) => setError(caught.message));
  }, [user]);

  // Results only show while there's something in the box. Leave yourself out of them.
  const shownResults = text.trim() ? results?.filter((person) => person.id !== user?.id) : undefined;

  return (
    <>
      <label className="mb-12 flex max-w-[720px] items-center gap-4 rounded-[20px] border border-periwinkle bg-paper px-6 py-4 shadow-[0_18px_40px_rgba(23,35,61,0.08)]">
        <span className="text-periwinkle">
          <SearchIcon size={22} />
        </span>
        <span className="sr-only">Search people</span>
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search by name or username"
          className="w-full bg-transparent text-lg text-navy outline-none placeholder:text-muted"
        />
      </label>

      {error && <p className="mb-8 rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{error}</p>}

      {shownResults ? (
        <PeopleList title="Results" people={shownResults} emptyText="Nobody matches that name." />
      ) : (
        user &&
        following && (
          <PeopleList
            title="People you follow"
            people={following}
            emptyText="You aren't following anyone yet. Search for friends above."
          />
        )
      )}
    </>
  );
}

function PeopleList({ title, people, emptyText }: { title: string; people: Profile[]; emptyText: string }) {
  return (
    <section className="max-w-[720px]">
      <h2 className="mb-4 text-[31px] leading-tight">{title}</h2>
      {people.length === 0 ? (
        <p className="text-[15px] text-muted">{emptyText}</p>
      ) : (
        <ul className="border-t border-line">
          {people.map((person) => (
            <PersonRow key={person.id} profile={person} />
          ))}
        </ul>
      )}
    </section>
  );
}

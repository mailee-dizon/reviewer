// "use client" is needed because the profile is loaded for whoever is looking, and the
// Follow button and tabs react to clicks.
"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import ButtonLink from "@/components/ButtonLink";
import FollowButton from "@/components/FollowButton";
import PersonRow from "@/components/PersonRow";
import SavedLists from "@/components/SavedLists";
import { loadSavedEntries, type SavedEntry } from "@/lib/library";
import {
  getFollowCounts,
  getFollowers,
  getFollowing,
  getProfile,
  nameOf,
  type Profile,
} from "@/lib/people";
import { useUser } from "@/lib/supabase";

type Tab = "lists" | "following" | "followers";

type ProfileViewProps = {
  usernameOrId: string; // the end of the address, e.g. "jdeguzman" in /u/jdeguzman
};

// Someone's profile: their name, follower counts, a Follow button, and tabs for their saved
// lists and the people they follow and are followed by.
export default function ProfileView({ usernameOrId }: ProfileViewProps) {
  const { user } = useUser();
  // undefined while loading, null if nobody has this username.
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<Tab>("lists");
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    getProfile(usernameOrId)
      .then(async (found) => {
        if (!isCurrent) return;
        setProfile(found);
        if (found) {
          const followCounts = await getFollowCounts(found.id);
          if (isCurrent) setCounts(followCounts);
        }
      })
      .catch((caught: Error) => isCurrent && setError(caught.message));
    return () => {
      isCurrent = false;
    };
  }, [usernameOrId]);

  if (error) {
    return <p className="rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{error}</p>;
  }
  if (profile === undefined) {
    return <p className="font-serif text-xl text-navy-soft">Loading profile…</p>;
  }
  if (profile === null) {
    return (
      <div className="max-w-[600px]">
        <h1 className="mb-6 text-[clamp(40px,5vw,60px)] leading-none tracking-tight">Nobody here</h1>
        <p className="mb-8 font-serif text-xl leading-normal text-navy-soft">
          We couldn&apos;t find anyone with the username “{usernameOrId}”.
        </p>
        <ButtonLink href="/people">Find people</ButtonLink>
      </div>
    );
  }

  const isYou = user?.id === profile.id;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "lists", label: "Lists" },
    { id: "following", label: "Following", count: counts.following },
    { id: "followers", label: "Followers", count: counts.followers },
  ];

  return (
    <>
      <header className="mb-12 flex flex-wrap items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Avatar profile={profile} size={88} />
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
              {isYou ? "YOUR PROFILE" : "PROFILE"}
            </p>
            <h1 className="text-[clamp(40px,5vw,64px)] leading-none tracking-tight">{nameOf(profile)}</h1>
            {profile.username && <p className="mt-2 text-[15px] text-muted">@{profile.username}</p>}
          </div>
        </div>
        {isYou ? (
          <ButtonLink href="/account" variant="outline">
            Edit profile
          </ButtonLink>
        ) : (
          <FollowButton
            personId={profile.id}
            onChange={(change) => setCounts({ ...counts, followers: counts.followers + change })}
          />
        )}
      </header>

      <div role="tablist" aria-label="Profile sections" className="mb-12 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(({ id, label, count }) => {
          const isActive = id === tab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(id)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 pb-4 pt-2 text-[17px] transition ${
                isActive ? "border-navy font-semibold text-navy" : "border-transparent text-navy-soft hover:text-navy"
              }`}
            >
              {label}
              {count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-lavender text-navy" : "bg-lavender-soft text-navy-soft"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={tabs.find(({ id }) => id === tab)?.label}>
        {tab === "lists" && <ProfileLists profile={profile} isYou={isYou} />}
        {tab === "following" && (
          <PeopleTab
            load={() => getFollowing(profile.id)}
            emptyText={isYou ? "You aren't following anyone yet." : `${nameOf(profile)} isn't following anyone yet.`}
          />
        )}
        {tab === "followers" && (
          <PeopleTab
            load={() => getFollowers(profile.id)}
            emptyText={isYou ? "Nobody follows you yet." : `Nobody follows ${nameOf(profile)} yet.`}
          />
        )}
      </div>
    </>
  );
}

// The "Lists" tab: the person's saved lists, unless they keep them private.
function ProfileLists({ profile, isYou }: { profile: Profile; isYou: boolean }) {
  const [saved, setSaved] = useState<Record<string, SavedEntry> | null>(null);
  const [error, setError] = useState("");
  const canSee = isYou || profile.listsPublic;

  useEffect(() => {
    if (!canSee) return;
    let isCurrent = true;
    loadSavedEntries(profile.id)
      .then((entries) => isCurrent && setSaved(entries))
      .catch((caught: Error) => isCurrent && setError(caught.message));
    return () => {
      isCurrent = false;
    };
  }, [profile.id, canSee]);

  if (!canSee) {
    return (
      <p className="font-serif text-xl text-navy-soft">{nameOf(profile)} keeps their lists private.</p>
    );
  }
  if (error) return <p className="rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{error}</p>;
  if (!saved) return <p className="text-[15px] text-muted">Loading lists…</p>;

  return (
    <>
      {isYou && !profile.listsPublic && (
        <p className="mb-8 rounded-xl bg-lavender-soft px-5 py-4 text-[15px] text-navy-soft">
          Only you can see your lists. You can share them in your account settings.
        </p>
      )}
      <SavedLists
        saved={saved}
        emptyText={(noun) => (isYou ? `Nothing here yet. Use the Save button on any ${noun} to add it.` : "Nothing here yet.")}
      />
    </>
  );
}

// The "Following" and "Followers" tabs: a list of people, loaded when the tab opens.
function PeopleTab({ load, emptyText }: { load: () => Promise<Profile[]>; emptyText: string }) {
  const [people, setPeople] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    load()
      .then((found) => isCurrent && setPeople(found))
      .catch((caught: Error) => isCurrent && setError(caught.message));
    return () => {
      isCurrent = false;
    };
    // "load" is a new function on every draw; the tab loads once each time it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{error}</p>;
  if (!people) return <p className="text-[15px] text-muted">Loading…</p>;
  if (people.length === 0) return <p className="font-serif text-xl text-navy-soft">{emptyText}</p>;

  return (
    <ul className="max-w-[720px] border-t border-line">
      {people.map((person) => (
        <PersonRow key={person.id} profile={person} />
      ))}
    </ul>
  );
}

// "use client" is needed because this form loads and saves the signed-in user's profile.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ButtonLink from "@/components/ButtonLink";
import { getProfile, profileHref, updateProfile, usernamePattern, type Profile } from "@/lib/people";
import { useUser } from "@/lib/supabase";

// The Account page's form: display name, username, and whether others can see your lists.
export default function AccountSettings() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [listsPublic, setListsPublic] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((found) => {
        if (!found) return;
        setProfile(found);
        setDisplayName(found.displayName ?? "");
        setUsername(found.username ?? "");
        setListsPublic(found.listsPublic);
      })
      .catch((caught: Error) => setMessage({ text: caught.message, isError: true }));
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-[600px]">
        <p className="mb-8 font-serif text-xl leading-normal text-navy-soft">
          Sign in to change your profile and privacy settings.
        </p>
        <ButtonLink href="/login?next=%2Faccount">Sign in</ButtonLink>
      </div>
    );
  }

  if (!profile) return <p className="text-[15px] text-muted">Loading your account…</p>;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const cleanUsername = username.trim().toLowerCase();
    if (!usernamePattern.test(cleanUsername)) {
      setMessage({
        text: "Usernames are 3 to 20 letters, numbers, or underscores, with no spaces.",
        isError: true,
      });
      return;
    }

    setIsBusy(true);
    setMessage(null);
    try {
      const changes = { username: cleanUsername, displayName: displayName.trim(), listsPublic };
      await updateProfile(user.id, changes);
      setProfile({ ...profile!, username: changes.username, displayName: changes.displayName, listsPublic });
      setUsername(cleanUsername);
      setMessage({ text: "Saved.", isError: false });
    } catch (caught) {
      setMessage({ text: (caught as Error).message, isError: true });
    }
    setIsBusy(false);
  }

  const inputStyles =
    "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-navy outline-none transition focus:border-periwinkle";

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px]">
      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-medium">Display name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={50}
          className={inputStyles}
        />
      </label>

      <label className="mb-8 block">
        <span className="mb-2 block text-sm font-medium">Username</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={20}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputStyles}
        />
        <span className="mt-2 block text-sm text-muted">
          Your profile address: rewind/u/{username.trim().toLowerCase() || "username"}
        </span>
      </label>

      <label className="mb-10 flex cursor-pointer items-start gap-4 rounded-xl border border-line bg-paper px-5 py-4">
        <input
          type="checkbox"
          checked={listsPublic}
          onChange={(event) => setListsPublic(event.target.checked)}
          className="mt-1 size-[18px] accent-[#7776a9]"
        />
        <span>
          <span className="block text-[15px] font-medium">Show my lists to other people</span>
          <span className="block text-sm text-muted">
            When this is off, only you can see what you&apos;re watching, reading, and playing. People can still
            follow you.
          </span>
        </span>
      </label>

      {message && (
        <p
          className={`mb-6 rounded-xl px-5 py-4 text-[15px] ${
            message.isError ? "bg-red-50 text-red-800" : "bg-lavender-soft text-navy"
          }`}
        >
          {message.text}{" "}
          {!message.isError && (
            <Link href={profileHref(profile)} className="text-periwinkle underline-offset-4 hover:underline">
              View your profile
            </Link>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={isBusy}
        className="rounded-full bg-navy px-7 py-3.5 text-[15px] font-medium text-cream transition hover:bg-navy-hover disabled:opacity-60"
      >
        {isBusy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

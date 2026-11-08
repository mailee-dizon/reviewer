// "use client" is needed because the button reacts to clicks and checks who is signed in.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/Icons";
import { follow, isFollowing, unfollow } from "@/lib/people";
import { useUser } from "@/lib/supabase";

type FollowButtonProps = {
  personId: string; // the person to follow
  // Called after following or unfollowing, with +1 or -1, so a follower count can update.
  onChange?: (change: 1 | -1) => void;
  size?: "large" | "small";
};

// "Follow" / "Following" for someone else's profile. Signed-out visitors get a link to sign
// in instead, and nothing is shown on your own profile.
export default function FollowButton({ personId, onChange, size = "large" }: FollowButtonProps) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  // null until we know whether the signed-in user follows this person.
  const [following, setFollowing] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.id === personId) return;
    let isCurrent = true;
    isFollowing(user.id, personId)
      .then((answer) => isCurrent && setFollowing(answer))
      .catch((caught: Error) => isCurrent && setError(caught.message));
    return () => {
      isCurrent = false;
    };
  }, [user, personId]);

  const sizeStyles = size === "large" ? "px-6 py-3 text-[15px]" : "px-4 py-2 text-sm";

  if (loading || user?.id === personId) return null;

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={`inline-flex items-center rounded-full bg-navy font-medium text-cream transition hover:bg-navy-hover ${sizeStyles}`}
      >
        Follow
      </Link>
    );
  }

  async function toggle() {
    if (!user || following === null) return;
    setIsBusy(true);
    setError("");
    try {
      if (following) {
        await unfollow(user.id, personId);
        onChange?.(-1);
      } else {
        await follow(user.id, personId);
        onChange?.(1);
      }
      setFollowing(!following);
    } catch (caught) {
      setError((caught as Error).message);
    }
    setIsBusy(false);
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={isBusy || following === null}
        aria-pressed={following ?? false}
        className={`inline-flex items-center gap-2 rounded-full font-medium transition disabled:opacity-60 ${sizeStyles} ${
          following
            ? "border border-periwinkle bg-lavender-soft text-navy hover:bg-lavender"
            : "bg-navy text-cream hover:bg-navy-hover"
        }`}
      >
        {following && <CheckIcon size={15} />}
        {following ? "Following" : "Follow"}
      </button>
      {error && <span className="text-sm text-red-800">{error}</span>}
    </span>
  );
}

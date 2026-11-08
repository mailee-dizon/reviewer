import Link from "next/link";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import { nameOf, profileHref, type Profile } from "@/lib/people";

// One person in a list (search results, followers, following): their badge, name, and
// username, linking to their profile, with a Follow button.

export default function PersonRow({ profile }: { profile: Profile }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-line py-4">
      <Link href={profileHref(profile)} className="group flex min-w-0 items-center gap-4">
        <Avatar profile={profile} />
        <span className="min-w-0">
          <span className="block truncate font-serif text-xl leading-tight transition group-hover:text-periwinkle">
            {nameOf(profile)}
          </span>
          {profile.username && <span className="block truncate text-sm text-muted">@{profile.username}</span>}
        </span>
      </Link>
      <FollowButton personId={profile.id} size="small" />
    </li>
  );
}

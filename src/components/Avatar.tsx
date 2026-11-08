import { initialsOf, type Profile } from "@/lib/people";

// A round badge with someone's initials, e.g. "JD", like the one in our Figma navigation bar.

type AvatarProps = {
  profile: Profile;
  size?: number; // in pixels
};

export default function Avatar({ profile, size = 44 }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className="inline-flex flex-none items-center justify-center rounded-full bg-navy font-medium tracking-wide text-cream"
    >
      {initialsOf(profile)}
    </span>
  );
}

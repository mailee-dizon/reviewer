import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";

// Someone's profile page, e.g. /u/jdeguzman. The folder name [username] means this one
// file handles every profile: whatever is after /u/ is passed in as "username".

type ProfilePageProps = {
  // In this version of Next.js, params arrive as a Promise, so we "await" them.
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-24">
      <ProfileView usernameOrId={decodeURIComponent(username)} />
    </main>
  );
}

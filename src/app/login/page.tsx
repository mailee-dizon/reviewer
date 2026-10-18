import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

type LoginPageProps = {
  // In this version of Next.js, searchParams arrive as a Promise, so we "await" them.
  searchParams: Promise<{ next?: string }>;
};

// The sign-in page ("/login"). "?next=/item/tt15239678" sends people back
// to that page once they've signed in.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  // Only allow addresses on this site, so the link can't send people elsewhere.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="mx-auto w-full max-w-[520px] flex-1 px-6 pb-28 pt-16 sm:pt-24">
      <LoginForm next={safeNext} />
    </main>
  );
}

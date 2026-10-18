// "use client" is needed because this component uses usePathname(),
// which reads the current web address in the browser so we can
// highlight the link for the page the user is on.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase, useUser } from "@/lib/supabase";

// The links shown in the navigation bar, in order.
const navLinks = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Books", href: "/books" },
  { label: "Movies", href: "/movies" },
  { label: "Shows", href: "/shows" },
  { label: "Games", href: "/games" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur-md">
      {/* On small screens the links wrap onto a second row that scrolls sideways. */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 px-5 py-3.5 md:grid md:h-20 md:grid-cols-[1fr_auto_1fr] md:px-[clamp(24px,5vw,76px)] md:py-0">
        {/* Logo: clicking it always returns to the Home page. */}
        <Link href="/" className="w-fit py-1.5 font-serif text-[29px] tracking-tight text-navy">
          REWIND<span className="text-periwinkle">.</span>
        </Link>

        <nav aria-label="Primary navigation" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-full bg-lavender px-3 py-2 text-sm font-semibold text-navy md:px-4 md:py-2.5"
                    : "whitespace-nowrap rounded-full px-3 py-2 text-sm text-navy-soft transition hover:bg-lavender-soft hover:text-navy md:px-4 md:py-2.5"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign in / sign out, on the right. */}
        <div className="flex justify-end">
          <AccountLink />
        </div>
      </div>
    </header>
  );
}

// "Sign in" for visitors, "Sign out" for signed-in users.
function AccountLink() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const styles =
    "whitespace-nowrap rounded-full px-4 py-2 text-sm text-periwinkle transition hover:bg-lavender-soft hover:text-navy";

  // Draw nothing until we know, so the button doesn't flicker.
  if (loading) return null;

  if (!user) {
    // Come back to this page after signing in (except from the sign-in page itself).
    const next = pathname === "/login" ? "/" : pathname;
    return (
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={styles}>
        Sign in
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => supabase.auth.signOut()} className={styles}>
      Sign out
    </button>
  );
}

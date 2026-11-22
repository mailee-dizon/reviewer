// "use client" is needed because this component uses usePathname(),
// which reads the current web address in the browser so we can
// highlight the link for the page the user is on, and because the
// menu on small screens opens and closes.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { CloseIcon, MenuIcon } from "@/components/Icons";
import { getProfile, nameOf, profileHref, type Profile } from "@/lib/people";
import { supabase, useUser } from "@/lib/supabase";

// The links shown in the navigation bar, in order.
// "signedInOnly" links are hidden from visitors who aren't signed in.
const navLinks = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Books", href: "/books" },
  { label: "Movies", href: "/movies" },
  { label: "Shows", href: "/shows" },
  { label: "Games", href: "/games" },
  { label: "Saved", href: "/saved", signedInOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const shownLinks = navLinks.filter((link) => !link.signedInOnly || user);
  // On small screens the links are in a menu that opens below the bar.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close the menu with Escape.
  useEffect(() => {
    if (!isMenuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-5 lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:px-[clamp(24px,5vw,76px)]">
        {/* Logo: clicking it always returns to the Home page. */}
        <Link href="/" className="w-fit py-1.5 font-serif text-[26px] tracking-tight text-navy lg:text-[29px]">
          REWIND<span className="text-periwinkle">.</span>
        </Link>

        {/* On wide screens the links sit in the middle of the bar. */}
        <nav aria-label="Primary navigation" className="hidden gap-1 lg:flex">
          {shownLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-full bg-lavender px-4 py-2.5 text-sm font-semibold text-navy"
                    : "whitespace-nowrap rounded-full px-4 py-2.5 text-sm text-navy-soft transition hover:bg-lavender-soft hover:text-navy"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign in or the account badge, plus the menu button on small screens. */}
        <div className="flex items-center justify-end gap-1">
          <AccountLink />
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-navy transition hover:bg-lavender-soft lg:hidden"
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* The menu on small screens: one large, easy-to-tap row per link. Choosing one closes it. */}
      {isMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Primary navigation"
          onClick={() => setIsMenuOpen(false)}
          className="border-t border-line px-3 pb-4 pt-2 lg:hidden"
        >
          {shownLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-xl px-4 py-3 text-[17px] transition ${
                  isActive ? "bg-lavender font-semibold text-navy" : "text-navy-soft hover:bg-lavender-soft hover:text-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

// "Sign in" for visitors. Signed-in users get their initials badge, which opens the account menu.
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

  return <AccountMenu userId={user.id} />;
}

// The menu under the initials badge: your profile, saved lists, finding people,
// account settings, and signing out.
function AccountMenu({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load the name for the badge. (It updates on the next page load after changing it.)
  useEffect(() => {
    getProfile(userId)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [userId]);

  // Close the menu when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  // Until the profile loads, show a plain badge.
  const shown: Profile = profile ?? { id: userId, username: null, displayName: "·", listsPublic: true };
  const itemStyles = "block w-full px-5 py-2.5 text-left text-[15px] text-navy transition hover:bg-lavender-soft";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Your account"
        className="rounded-full transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-periwinkle"
      >
        <Avatar profile={shown} size={42} />
      </button>

      {isOpen && (
        // Choosing an item closes the menu.
        <div
          role="menu"
          onClick={() => setIsOpen(false)}
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-paper py-2 shadow-[0_16px_40px_rgba(23,35,61,0.16)]"
        >
          {profile && (
            <div className="mb-1 border-b border-line px-5 pb-3 pt-1">
              <p className="truncate font-serif text-lg leading-tight">{nameOf(profile)}</p>
              {profile.username && <p className="truncate text-sm text-muted">@{profile.username}</p>}
            </div>
          )}
          {profile && (
            <Link href={profileHref(profile)} role="menuitem" className={itemStyles}>
              Your profile
            </Link>
          )}
          <Link href="/saved" role="menuitem" className={itemStyles}>
            Saved
          </Link>
          <Link href="/people" role="menuitem" className={itemStyles}>
            Find people
          </Link>
          <Link href="/account" role="menuitem" className={itemStyles}>
            Account settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => supabase.auth.signOut()}
            className={`${itemStyles} mt-1 border-t border-line pt-3 text-periwinkle`}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

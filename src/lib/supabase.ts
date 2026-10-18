// The connection to our Supabase database, used from the browser.
// The URL and publishable key are safe to share: Row Level Security rules in the
// database decide what each visitor can read and change (see supabase/setup.sql).
"use client";

import { createClient, type User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

// A React hook that returns the signed-in user (or null), and re-draws when
// they sign in or out. "loading" is true until we know either way.
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires once straight away with the current session, then on every sign in/out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

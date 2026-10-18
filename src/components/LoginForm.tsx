// "use client" is needed because this form signs people in from the browser.
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type LoginFormProps = {
  next: string; // where to go after signing in
};

export default function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    setError("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Saved with the account; the database copies them into "profiles".
          data: { display_name: displayName.trim(), username: username.trim().toLowerCase() },
          // The confirmation email links back here.
          emailRedirectTo: `${window.location.origin}${next}`,
        },
      });
      setIsBusy(false);
      if (error) return setError(error.message);
      // No session yet means Supabase sent a confirmation email first.
      if (!data.session) return setCheckEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsBusy(false);
      if (error) return setError(error.message);
    }

    router.push(next);
  }

  if (checkEmail) {
    return (
      <div>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
          ALMOST THERE
        </p>
        <h1 className="mb-5 text-[clamp(40px,6vw,56px)] leading-none tracking-tight">
          Check your email
        </h1>
        <p className="font-serif text-xl leading-normal text-navy-soft">
          We sent a link to {email}. Click it to confirm your account, and you&apos;ll be
          signed in.
        </p>
      </div>
    );
  }

  const inputStyles =
    "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-navy outline-none transition placeholder:text-muted focus:border-periwinkle";

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
        {isSignUp ? "JOIN REWIND" : "WELCOME BACK"}
      </p>
      <h1 className="mb-10 text-[clamp(40px,6vw,56px)] leading-none tracking-tight">
        {isSignUp ? "Create an account" : "Sign in"}
      </h1>

      {isSignUp && (
        <>
          <Field label="Display name">
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              maxLength={60}
              placeholder="e.g. Maya Chen"
              className={inputStyles}
            />
          </Field>
          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_]+"
              title="Letters, numbers, and underscores only"
              placeholder="e.g. mayachen"
              className={inputStyles}
            />
          </Field>
        </>
      )}

      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className={inputStyles}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={inputStyles}
        />
      </Field>

      {error && (
        <p className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{error}</p>
      )}

      <button
        type="submit"
        disabled={isBusy}
        className="mb-6 w-full rounded-full bg-navy px-6 py-4 text-[15px] font-medium text-cream transition hover:bg-navy-hover disabled:opacity-60"
      >
        {isBusy ? "One moment…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-[15px] text-navy-soft">
        {isSignUp ? "Already have an account?" : "New to REWIND?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? "sign-in" : "sign-up");
            setError("");
          }}
          className="text-periwinkle underline-offset-4 hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </button>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

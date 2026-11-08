import type { Metadata } from "next";
import AccountSettings from "@/components/AccountSettings";

export const metadata: Metadata = { title: "Account" };

// The Account page ("/account"): change your name, username, and who can see your lists.
export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">SETTINGS</p>
      <h1 className="mb-10 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">Account</h1>
      <AccountSettings />
    </main>
  );
}

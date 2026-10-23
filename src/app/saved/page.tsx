import type { Metadata } from "next";
import SavedView from "@/components/SavedView";

export const metadata: Metadata = { title: "Saved" };

// The Saved page ("/saved"): everything the visitor saved, in three lists.
// Saved items live in the visitor's browser, so SavedView shows them.
export default function SavedPage() {
  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">YOUR LIBRARY</p>
      <h1 className="mb-10 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">Saved</h1>
      <SavedView />
    </main>
  );
}

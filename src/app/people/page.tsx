import type { Metadata } from "next";
import PeopleSearch from "@/components/PeopleSearch";

export const metadata: Metadata = { title: "Find people" };

// The Find people page ("/people"): search for other members to follow.
export default function PeoplePage() {
  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">COMMUNITY</p>
      <h1 className="mb-10 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">Find people</h1>
      <PeopleSearch />
    </main>
  );
}

import ButtonLink from "@/components/ButtonLink";

// Shown when someone visits an address that doesn't exist (a "404" page).
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-28 pt-24 sm:px-[clamp(24px,6vw,80px)]">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">PAGE NOT FOUND</p>
      <h1 className="mb-6 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">
        We couldn&apos;t find that page.
      </h1>
      <p className="mb-8 max-w-[600px] font-serif text-xl text-navy-soft">
        The link may be broken, or the page may not exist yet.
      </p>
      <ButtonLink href="/">Back to Home</ButtonLink>
    </main>
  );
}

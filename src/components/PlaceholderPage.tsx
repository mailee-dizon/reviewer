import ButtonLink from "@/components/ButtonLink";

// A simple "under development" page. Search, Books, Movies, Shows, and Games
// all use this for now, so they look the same and are easy to replace later.

type PlaceholderPageProps = {
  eyebrow: string; // small text above the title
  title: string;
  links: { label: string; href: string }[]; // buttons to other pages
};

export default function PlaceholderPage({ eyebrow, title, links }: PlaceholderPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,6vw,80px)] sm:pt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">{eyebrow}</p>
      <h1 className="mb-6 text-[clamp(45px,6vw,75px)] leading-none tracking-tight">{title}</h1>
      <p className="mb-8 max-w-[600px] font-serif text-xl leading-normal text-navy-soft">
        This page is currently under development.
      </p>

      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        <ButtonLink href="/">Back to Home</ButtonLink>
        {links.map((link) => (
          <ButtonLink key={link.href} href={link.href} variant="outline">
            {link.label}
          </ButtonLink>
        ))}
      </div>
    </main>
  );
}

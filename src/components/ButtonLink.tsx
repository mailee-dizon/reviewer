import Link from "next/link";

// A link that looks like a button. We use links (not <button>) for anything
// that goes to another page, so the browser Back button works normally.
//
// variant="primary" -> solid navy pill (main action)
// variant="outline" -> outlined lavender pill (secondary action)

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
};

export default function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const baseStyles =
    "inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium transition hover:-translate-y-px";

  const variantStyles =
    variant === "primary"
      ? "bg-navy text-cream hover:bg-navy-hover"
      : "border border-periwinkle text-periwinkle hover:bg-lavender-soft";

  return (
    <Link href={href} className={`${baseStyles} ${variantStyles}`}>
      {children}
    </Link>
  );
}

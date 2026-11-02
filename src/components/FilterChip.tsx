// A rounded filter button, e.g. "All reviews" or "Drama". "active" shows it as chosen.
// Used by the reviews section's rating filter and the Saved page's genre filter.

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  label?: string; // read aloud by screen readers instead of the visible text
  children: React.ReactNode;
};

export default function FilterChip({ active, onClick, label, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm transition ${
        active
          ? "border-periwinkle bg-lavender text-navy"
          : "border-line text-navy-soft hover:bg-lavender-soft"
      }`}
    >
      {children}
    </button>
  );
}

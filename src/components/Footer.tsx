// The footer shown at the bottom of every page.
export default function Footer() {
  return (
    <footer className="flex flex-col justify-center gap-2 border-t border-line px-6 py-10 text-navy-soft sm:min-h-[125px] sm:flex-row sm:items-center sm:justify-between sm:px-[clamp(24px,5vw,76px)] sm:py-0">
      <span className="font-serif text-[22px] text-navy">REWIND.</span>
      <p className="text-[11px]">Keep the stories that stay with you.</p>
    </footer>
  );
}

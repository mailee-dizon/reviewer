import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

// The text shown in the browser tab. Pages can set their own title,
// and "%s" is replaced with it (for example "Books | REWIND").
export const metadata: Metadata = {
  title: {
    default: "REWIND",
    template: "%s | REWIND",
  },
  description: "Discover, track, and review the movies, shows, books, and games that stay with you.",
};

// The root layout wraps every page, so the navigation bar and footer
// appear on every page automatically.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

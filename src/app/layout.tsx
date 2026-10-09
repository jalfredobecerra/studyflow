import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Study Flow",
  title: {
    default: "Study Flow",
    template: "%s | Study Flow",
  },
  description:
    "Study Flow helps students organize notes, create flashcards, and build better study habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

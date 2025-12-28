import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "engblogs",
  description:
    "summaries of the latest blog articles from your favorite tech companies.",
  openGraph: {
    type: "website",
    url: "https://www.engblogs.dev",
    siteName: "engblogs",
    images: [
      {
        url: "/thumbnail.png",
        alt: "engblogs.dev homepage",
      },
    ],
  },
  twitter: {
    creator: "@ishan0102",
    site: "@ishan0102",
    card: "summary_large_image",
  },
  icons: "/favicon.png",
  metadataBase: new URL("https://engblogs.dev"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body
        className={cn(
          GeistSans.className,
          "grid h-full w-full bg-background text-sm text-foreground [grid-template-rows:min-content_auto_min-content] md:text-base",
        )}
      >
        <header className="flex w-full flex-col items-start justify-start gap-2 border-b border-b-background-light p-4 md:flex-row md:items-center md:px-6 md:py-4">
          <Link href="/">
            <h1
              className={cn(
                GeistMono.className,
                "rounded-full border border-background-light bg-background-light px-3 py-1 leading-5 text-foreground-light",
              )}
            >
              engblogs
            </h1>
          </Link>
          <span className="hidden h-1 w-1 rounded-full bg-background-light md:block"></span>
          <span className="leading-5 text-foreground">
            summaries of the latest blog articles from your favorite tech
            companies.
          </span>
        </header>

        <main className="p-4 md:px-6 md:py-4">{children}</main>

        <footer className="flex w-full flex-col items-start justify-start gap-2 border-t border-t-background-light p-4 md:px-6 md:py-4">
          <p>
            built by{" "}
            <Link
              className="underline decoration-foreground decoration-dotted underline-offset-1 transition-colors hover:text-foreground-light hover:decoration-foreground-light"
              href="https://www.ishanshah.me/"
              target="_blank"
            >
              ishan
            </Link>{" "}
            and{" "}
            <Link
              className="underline decoration-foreground decoration-dotted underline-offset-1 transition-colors hover:text-foreground-light hover:decoration-foreground-light"
              href="https://www.linus.systems"
              target="_blank"
            >
              linus
            </Link>
            , summaries by GPT .
          </p>
          <p className="flex items-center gap-4">
            <Link
              className="rounded-lg bg-background-light px-2 py-1 transition-colors hover:text-foreground-light"
              href="https://donate.stripe.com/9AQaEK6A26Dz6kgbII"
              target="_blank"
            >
              donate
            </Link>
            <Link
              href="https://github.com/ishan0102/engblogs"
              className="transition-colors hover:text-foreground-light"
            >
              github
            </Link>
            <Link
              href="/support"
              className="transition-colors hover:text-foreground-light"
            >
              support
            </Link>
            <Link
              href="https://apps.apple.com/us/app/engblogs/id6457546082"
              className="transition-colors hover:text-foreground-light"
              target="_blank"
            >
              ios app
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground-light"
            >
              privacy
            </Link>
          </p>
        </footer>
      </body>

      <Analytics />
    </html>
  );
}

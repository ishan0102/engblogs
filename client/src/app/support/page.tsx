import Link from "next/link";

export default function Privacy() {
  return (
    <div className="flex justify-center py-8">
      <div className="flex max-w-3xl flex-col gap-4">
        <h1 className="text-2xl font-bold">Support</h1>
        <p>
          If you&apos;re experiencing issues with engblogs, we&apos;re here to
          help! Please send an email to{" "}
          <Link
            className="underline decoration-foreground decoration-dotted underline-offset-1 transition-colors hover:text-foreground-light hover:decoration-foreground-light"
            href="mailto:ishan0102@gmail.com?subject=Engblogs Support Request"
          >
            ishan0102@gmail.com
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

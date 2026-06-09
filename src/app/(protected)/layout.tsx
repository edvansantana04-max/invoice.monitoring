import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Project & Termin" },
  { href: "/cashflow", label: "Cashflow" },
  { href: "/prospects", label: "Prospect" },
  { href: "/import", label: "Import Excel" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link href="/" className="text-sm font-semibold">
            USD Ops
          </Link>

          <nav className="flex flex-1 flex-wrap gap-x-4 gap-y-2 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-slate-600 hover:text-slate-900"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}


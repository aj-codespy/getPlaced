import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const ALL_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

interface PublicNavbarProps {
  currentPath: string;
}

export function PublicNavbar({ currentPath }: PublicNavbarProps) {
  const links = ALL_LINKS.filter((l) => l.href !== currentPath);

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight group">
        <div className="relative h-9 w-9 shrink-0">
          <Image
            src="/logo.png"
            alt="getPlaced"
            width={36}
            height={36}
            className="drop-shadow-[0_0_10px_rgba(99,102,241,0.4)] group-hover:drop-shadow-[0_0_16px_rgba(99,102,241,0.6)] transition-all duration-300"
          />
        </div>
        <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          getPlaced
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="hover:text-white transition-colors duration-200"
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">
          Log in
        </Link>
        <Link href="/signup">
          <button className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-500/50 transition-all duration-200 hover:shadow-indigo-500/40 hover:shadow-xl">
            Get started free
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>
    </nav>
  );
}

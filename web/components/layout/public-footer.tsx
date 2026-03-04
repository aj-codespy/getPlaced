import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm text-slate-400 hover:text-white transition-colors">
          <Image
            src="/logo.png"
            alt="getPlaced"
            width={24}
            height={24}
            className="drop-shadow-[0_0_6px_rgba(99,102,241,0.3)]"
          />
          getPlaced
        </Link>
        <div className="flex items-center gap-6 text-xs text-slate-600">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          <Link href="/refund" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
          <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
        </div>
        <p className="text-xs text-slate-700">© 2026 getPlaced. All rights reserved.</p>
      </div>
    </footer>
  );
}

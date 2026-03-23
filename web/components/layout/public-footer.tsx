import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#071022]/60 px-6 py-8 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 md:flex-row">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm text-slate-300 hover:text-white transition-colors">
          <Image
            src="/logo.png"
            alt="getPlaced"
            width={24}
            height={24}
            className="drop-shadow-[0_0_10px_rgba(99,132,255,0.4)]"
          />
          getPlaced
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
          <Link href="/refund" className="hover:text-slate-200 transition-colors">Refund Policy</Link>
          <Link href="/faq" className="hover:text-slate-200 transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-slate-200 transition-colors">Contact</Link>
        </div>
        <p className="text-xs text-slate-500">© 2026 getPlaced. All rights reserved.</p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Briefcase } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm text-slate-400 hover:text-white transition-colors">
          <div className="h-6 w-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
            <Briefcase size={12} className="text-white" />
          </div>
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

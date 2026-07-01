import Link from "next/link";
import Logo from "@/shared/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" size="sm" href="/" />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">{children}</main>

      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Medha Sync. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy policy</Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of service</Link>
            <a href="https://medhalabs.in/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
              Medha Labs
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

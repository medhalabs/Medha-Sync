"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import {
  Inbox, Users, GitBranch, Megaphone, Zap, BookOpen, BarChart2, Settings, LogOut, MessageSquare,
} from "lucide-react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <MessageSquare className="w-5 h-5 text-brand-500 mr-2" />
        <span className="font-semibold text-gray-900 text-sm">Medha Platform</span>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-lg transition-colors",
              path.startsWith(href)
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-full rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

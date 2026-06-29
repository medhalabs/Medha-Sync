"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import {
  Inbox, Users, GitBranch, Megaphone, Zap, BookOpen, BarChart2, Settings, LogOut, MessageSquare,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const nav = [
  { href: "/inbox",       label: "Inbox",       icon: Inbox },
  { href: "/contacts",    label: "Contacts",     icon: Users },
  { href: "/pipeline",    label: "Pipeline",     icon: GitBranch },
  { href: "/broadcasts",  label: "Broadcasts",   icon: Megaphone },
  { href: "/automations", label: "Automations",  icon: Zap },
  { href: "/catalog",     label: "Catalog",      icon: BookOpen },
  { href: "/analytics",   label: "Analytics",    icon: BarChart2 },
];

export default function Sidebar() {
  const path = usePathname();
  const { data: session } = useSession();
  const userName = (session?.user as any)?.name || "User";
  const userEmail = (session?.user as any)?.email || "";
  const initials = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-3 flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-tight">Medha Sync</span>
            <span className="text-xs font-bold text-orange-600 bg-orange-900/40 border border-orange-700/50 px-1.5 py-0.5 rounded-full">BETA</span>
          </div>
          <p className="text-xs text-gray-500 leading-none mt-0.5">WhatsApp CRM</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              active
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}>
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-gray-500")} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-gray-800">
          <Link href="/settings" className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
            path.startsWith("/settings")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/30"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          )}>
            <Settings className={cn("w-4 h-4 flex-shrink-0", path.startsWith("/settings") ? "text-white" : "text-gray-500")} />
            Settings
            {path.startsWith("/settings") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
          </Link>
        </div>
      </nav>

      {/* User + sign out */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="p-1 rounded-lg text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

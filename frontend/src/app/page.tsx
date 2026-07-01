import Link from "next/link";
import { getSession } from "@/shared/lib/auth";
import Logo from "@/shared/components/Logo";
import {
  Inbox, GitBranch, Zap, BookOpen, BarChart2, Megaphone,
  ArrowRight, CheckCircle, Users, Bot, Mail, Sparkles, ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    description: "All WhatsApp & Email conversations in one place. Take over from the bot, tag contacts, and resolve chats instantly.",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
  },
  {
    icon: Bot,
    title: "Smart WhatsApp Bot",
    description: "Build a multi-level catalog menu (up to 10 levels deep) that responds automatically — zero code needed.",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
  },
  {
    icon: GitBranch,
    title: "Sales Pipeline",
    description: "Drag deals across stages, track deal values, and manage your entire sales flow on a Kanban board.",
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Trigger keyword flows that send messages, add tags, and assign contacts — all on autopilot.",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
  },
  {
    icon: Megaphone,
    title: "Bulk Broadcasts",
    description: "Send targeted WhatsApp campaigns to filtered contact segments — promotions, follow-ups, announcements.",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    description: "Track message volume, resolution rates, bot performance, and team activity across all channels.",
    gradient: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50",
  },
];

const steps = [
  { n: "01", title: "Connect WhatsApp", desc: "Scan a QR code to link your WhatsApp number — takes under 30 seconds." },
  { n: "02", title: "Build your catalog", desc: "Add products, services, or menu items with descriptions and brochures." },
  { n: "03", title: "Set a trigger keyword", desc: "When a customer sends your keyword, the bot shows your catalog automatically." },
  { n: "04", title: "Take over & close deals", desc: "Jump in from the inbox, reply as a human, and track deals in the pipeline." },
];

const stats = [
  { value: "10x", label: "faster response time" },
  { value: "10", label: "levels of menu nesting" },
  { value: "∞", label: "contacts & conversations" },
  { value: "24/7", label: "automated bot coverage" },
];

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="full" size="sm" href="/" />
            <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">BETA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600 font-medium">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#stats" className="hover:text-indigo-600 transition-colors">Why us</a>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/inbox" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors px-3 py-2">
                  Sign in
                </Link>
                <Link href="/register" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                  Get started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-indigo-100/60 via-purple-50/40 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-indigo-100/50 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            WhatsApp CRM for growing businesses
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Your customers text on
            <span className="relative mx-3 inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">WhatsApp.</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-indigo-100 rounded-full -z-0" />
            </span>
            <br className="hidden md:block" />
            Manage it all here.
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Medha Sync is your all-in-one platform to handle WhatsApp conversations, automate replies with a smart bot, manage a product catalog, track deals, and broadcast messages.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isLoggedIn ? "/inbox" : "/register"}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5">
              {isLoggedIn ? "Open dashboard" : "Start for free"} <ArrowRight className="w-4 h-4" />
            </Link>
            {!isLoggedIn && (
              <Link href="/login"
                className="flex items-center gap-2 text-gray-600 border border-gray-200 px-8 py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Sign in to your account
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-gray-500">
            {["No credit card required", "Set up in 2 minutes", "WhatsApp + Email in one place"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-16 border-y border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-black text-white mb-1">{value}</div>
              <div className="text-sm text-indigo-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Everything you need, nothing you don't</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Six powerful modules — built to handle every part of your customer communication workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, gradient, bg }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From zero to a fully automated WhatsApp CRM — no technical setup required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200" />
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="relative flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center mb-5 shadow-lg shadow-indigo-200 relative z-10">
                  <span className="text-xs font-bold text-indigo-200">{n}</span>
                  <span className="text-sm font-bold text-white leading-tight mt-0.5 px-2">{title.split(" ")[0]}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Team collaboration</p>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Built for teams of all sizes</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Invite agents, assign roles (owner / admin / agent / viewer), and manage who can see and do what. The bot handles the queue — your team handles the closings.
            </p>
            <ul className="space-y-3">
              {["Invite team members with one click", "Role-based access control", "See who's handling each conversation", "Bot auto-routes, agents take over"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Team members</h3>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-1 rounded-full">4 members</span>
            </div>
            {[
              { name: "Priya Sharma", email: "priya@company.com", role: "owner", color: "from-pink-500 to-rose-500" },
              { name: "Rahul Mehta", email: "rahul@company.com", role: "admin", color: "from-blue-500 to-indigo-500" },
              { name: "Sneha Gupta", email: "sneha@company.com", role: "agent", color: "from-emerald-500 to-green-500" },
              { name: "Kiran Patel", email: "kiran@company.com", role: "viewer", color: "from-amber-500 to-orange-500" },
            ].map(({ name, email, role, color }) => (
              <div key={name} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full capitalize">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Ready to transform your customer communication?</h2>
          <p className="text-gray-500 mb-10 text-lg">Join businesses already using Medha Sync to manage WhatsApp at scale.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isLoggedIn ? "/inbox" : "/register"}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5">
              {isLoggedIn ? "Go to dashboard" : "Create free account"} <ArrowRight className="w-4 h-4" />
            </Link>
            {!isLoggedIn && (
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                Already have an account <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <Logo variant="full" size="sm" href="/" className="mb-3" />
              <p className="text-sm text-gray-500 max-w-xs">WhatsApp CRM for growing businesses. Automate, manage, and scale customer conversations.</p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold text-gray-900 mb-3">Product</p>
                <ul className="space-y-2 text-gray-500">
                  <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a></li>
                  <li><Link href={isLoggedIn ? "/inbox" : "/register"} className="hover:text-indigo-600 transition-colors">Get started</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-3">Account</p>
                <ul className="space-y-2 text-gray-500">
                  {!isLoggedIn && <li><Link href="/register" className="hover:text-indigo-600 transition-colors">Register</Link></li>}
                  <li><Link href="/login" className="hover:text-indigo-600 transition-colors">Sign in</Link></li>
                  {isLoggedIn && <li><Link href="/inbox" className="hover:text-indigo-600 transition-colors">Dashboard</Link></li>}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-3">Legal</p>
                <ul className="space-y-2 text-gray-500">
                  <li><Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy policy</Link></li>
                  <li><Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 pb-2">
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 mb-4">
              <p className="text-xs text-orange-900 font-medium">
                ⚠️ <strong>BETA Version:</strong> This is early-stage software. Expect bugs, breaking changes, and occasional downtime. Do not use with critical production data.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
              <span>© {new Date().getFullYear()} Medha Sync. All rights reserved.</span>
            <span>
              Developed by{" "}
              <a href="https://medhalabs.in/" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 font-semibold hover:underline">
                Medha Labs
              </a>
              {" "}· <a href="https://medhalabs.in/" target="_blank" rel="noopener noreferrer" className="hover:underline">medhalabs.in</a>
            </span>
          </div>
        </div>
        </div>
      </footer>
    </div>
  );
}

"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { MessageSquare, Mail, Users, CheckCircle, Bot, UserCheck, Hash, TrendingUp, ArrowUpRight } from "lucide-react";

const statCards = (overview: any, statusBreakdown: any, totalConv: number, resolvedPct: number) => [
  {
    label: "Total contacts",
    value: overview?.total_contacts ?? "—",
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
    light: "bg-blue-50 text-blue-600",
    trend: "+12% this month",
  },
  {
    label: "Total messages",
    value: overview?.total_messages ?? "—",
    icon: Hash,
    gradient: "from-violet-500 to-purple-600",
    light: "bg-violet-50 text-violet-600",
    trend: `${overview?.messages_today ?? 0} today`,
  },
  {
    label: "WhatsApp convos",
    value: overview?.whatsapp_conversations ?? "—",
    icon: MessageSquare,
    gradient: "from-emerald-500 to-green-600",
    light: "bg-emerald-50 text-emerald-600",
    trend: `${overview?.open_conversations ?? 0} open`,
  },
  {
    label: "Email convos",
    value: overview?.email_conversations ?? "—",
    icon: Mail,
    gradient: "from-pink-500 to-rose-600",
    light: "bg-pink-50 text-pink-600",
    trend: "across all accounts",
  },
  {
    label: "Bot handled",
    value: overview?.bot_conversations ?? "—",
    icon: Bot,
    gradient: "from-sky-500 to-cyan-600",
    light: "bg-sky-50 text-sky-600",
    trend: "auto-resolved",
  },
  {
    label: "Agent handled",
    value: overview?.agent_conversations ?? "—",
    icon: UserCheck,
    gradient: "from-amber-500 to-orange-600",
    light: "bg-amber-50 text-amber-600",
    trend: "human takeovers",
  },
  {
    label: "Resolved today",
    value: overview?.resolved_today ?? "—",
    icon: CheckCircle,
    gradient: "from-teal-500 to-emerald-600",
    light: "bg-teal-50 text-teal-600",
    trend: "closed chats",
  },
  {
    label: "Resolution rate",
    value: totalConv > 0 ? `${resolvedPct}%` : "—",
    icon: TrendingUp,
    gradient: "from-indigo-500 to-blue-600",
    light: "bg-indigo-50 text-indigo-600",
    trend: `${statusBreakdown?.resolved ?? 0} of ${totalConv}`,
  },
];

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981"];

export default function AnalyticsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get("/api/analytics").then((r) => r.data),
    refetchInterval: 60000,
  });

  const overview = data?.overview;
  const volume = data?.volume_last_7_days || [];
  const statusBreakdown = data?.status_breakdown;
  const totalConv = overview?.total_conversations ?? 0;
  const resolvedPct = totalConv > 0 ? Math.round(((statusBreakdown?.resolved ?? 0) / totalConv) * 100) : 0;

  const pieData = statusBreakdown ? [
    { name: "Bot", value: statusBreakdown.bot },
    { name: "Agent", value: statusBreakdown.agent },
    { name: "Resolved", value: statusBreakdown.resolved },
  ] : [];

  const cards = statCards(overview, statusBreakdown, totalConv, resolvedPct);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time CRM performance overview</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, gradient, light, trend }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{isLoading ? "…" : value}</p>
            <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{trend}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Conversation volume</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />WhatsApp</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />Email</span>
            </div>
          </div>
          {isLoading ? (
            <div className="h-56 flex items-center justify-center text-sm text-gray-400">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={volume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="em" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", fontSize: 12 }} />
                <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#10b981" strokeWidth={2} fill="url(#wa)" dot={false} />
                <Area type="monotone" dataKey="email" name="Email" stroke="#818cf8" strokeWidth={2} fill="url(#em)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Status breakdown</h2>
            <p className="text-xs text-gray-400 mt-0.5">All conversations</p>
          </div>
          {isLoading || pieData.every(d => d.value === 0) ? (
            <div className="h-56 flex items-center justify-center text-sm text-gray-400">
              {isLoading ? "Loading…" : "No conversations yet"}
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-3">
                {pieData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-xs text-gray-600">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">{value}</span>
                      <span className="text-xs text-gray-400">
                        {totalConv > 0 ? `${Math.round((value / totalConv) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolution progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Resolution progress</h2>
            <p className="text-xs text-gray-400 mt-0.5">Open vs resolved conversations</p>
          </div>
          <span className="text-2xl font-bold text-gray-900">{resolvedPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${resolvedPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <span>{statusBreakdown?.resolved ?? 0} resolved</span>
          <span>{overview?.open_conversations ?? 0} still open</span>
        </div>
      </div>
    </div>
  );
}

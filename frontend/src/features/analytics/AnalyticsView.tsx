"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MessageSquare, Mail, Users, CheckCircle } from "lucide-react";

export default function AnalyticsView() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get("/api/analytics").then((r) => r.data),
    refetchInterval: 60000,
  });

  const overview = data?.overview;
  const volume = data?.volume_last_7_days || [];

  const stats = [
    { label: "Total contacts", value: overview?.total_contacts ?? "—", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "WhatsApp convos", value: overview?.whatsapp_conversations ?? "—", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
    { label: "Email convos", value: overview?.email_conversations ?? "—", icon: Mail, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Resolved today", value: overview?.resolved_today ?? "—", icon: CheckCircle, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Message volume — last 7 days</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={volume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "none", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="whatsapp" name="WhatsApp" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="email" name="Email" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

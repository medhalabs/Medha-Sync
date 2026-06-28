"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import Badge from "@/shared/components/Badge";
import { Users, Key, Mail, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsView() {
  const [tab, setTab] = useState<"team" | "email" | "whatsapp" | "api">("team");
  const qc = useQueryClient();

  const { data: team } = useQuery({ queryKey: ["team"], queryFn: () => api.get("/api/team").then((r) => r.data) });
  const { data: apiKeys } = useQuery({ queryKey: ["api-keys"], queryFn: () => api.get("/api/api-keys").then((r) => r.data) });

  const createKeyMutation = useMutation({
    mutationFn: () => api.post("/api/api-keys", { name: `Key ${Date.now()}`, scopes: ["read", "write"] }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast.success(`Key created: ${res.data.raw_key}`); },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast.success("Key revoked"); },
  });

  const tabs = [
    { id: "team", label: "Team", icon: Users },
    { id: "email", label: "Email accounts", icon: Mail },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "api", label: "API keys", icon: Key },
  ] as const;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "team" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Member</th><th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th><th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th></tr></thead>
            <tbody>
              {(team || []).map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={u.is_active ? "success" : "danger"}>{u.is_active ? "active" : "inactive"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "api" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">API keys for external integrations. The key is shown once — copy it immediately.</p>
            <button onClick={() => createKeyMutation.mutate()} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
              <Key className="w-4 h-4" />
              Generate key
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th><th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Scopes</th><th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th><th className="px-4 py-3" /></tr></thead>
              <tbody>
                {(apiKeys || []).map((k: any) => (
                  <tr key={k.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{k.name}</td>
                    <td className="px-4 py-3">{k.scopes.map((s: string) => <Badge key={s} className="mr-1">{s}</Badge>)}</td>
                    <td className="px-4 py-3"><Badge variant={k.is_active ? "success" : "danger"}>{k.is_active ? "active" : "revoked"}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => revokeKeyMutation.mutate(k.id)} className="text-xs text-red-500 hover:underline">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "whatsapp" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-1">WhatsApp connection</h2>
          <p className="text-sm text-gray-500 mb-4">Scan the QR code below with your WhatsApp to connect via Baileys.</p>
          <QrCode />
        </div>
      )}

      {tab === "email" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Configure IMAP email accounts in your <code className="bg-gray-100 px-1 rounded text-xs">.env</code> file, then use the sync endpoint to pull in emails.</p>
        </div>
      )}
    </div>
  );
}

function QrCode() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["wa-qr"],
    queryFn: () => api.get("/api/whatsapp/qr").then((r) => r.data),
    refetchInterval: 8000,
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.post("/api/whatsapp/disconnect"),
    onSuccess: () => {
      toast.success("WhatsApp disconnected");
      qc.invalidateQueries({ queryKey: ["wa-qr"] });
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  if (isLoading) return <div className="text-sm text-gray-400">Loading...</div>;

  const connected = !data?.qr;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${connected ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-yellow-500"}`} />
          {connected ? "Connected" : "Waiting for scan"}
        </span>
        {connected && (
          <button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
          </button>
        )}
      </div>

      {data?.qr ? (
        <div>
          <img src={data.qr} alt="WhatsApp QR code" className="w-52 h-52 border border-gray-200 rounded-xl" />
          <p className="text-xs text-gray-400 mt-2">QR refreshes every 8 seconds — scan quickly</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Your WhatsApp is connected. Messages will appear in the Inbox.
        </p>
      )}
    </div>
  );
}

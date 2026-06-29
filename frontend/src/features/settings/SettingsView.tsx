"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import Badge from "@/shared/components/Badge";
import { Users, Key, Mail, MessageSquare, Trash2, RefreshCw, UserPlus, Pencil, X, Check, Shield, Zap } from "lucide-react";
import toast from "react-hot-toast";

const ROLES = ["owner", "admin", "agent", "viewer"] as const;
type Role = typeof ROLES[number];

const roleBadgeColor: Record<Role, string> = {
  owner: "bg-purple-50 text-purple-700",
  admin: "bg-blue-50 text-blue-700",
  agent: "bg-green-50 text-green-700",
  viewer: "bg-gray-100 text-gray-600",
};

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", role: "agent" as Role });
  const mutation = useMutation({
    mutationFn: (d: typeof form) => api.post("/api/team/invite", d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success(`${res.data.name} added — temporary password generated`);
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Failed to invite member"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Invite team member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Smith"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="jane@company.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">A temporary password will be auto-generated and must be shared with the member.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => mutation.mutate(form)}
              disabled={!form.name || !form.email || mutation.isPending}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? "Inviting…" : "Send invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamRow({ member }: { member: any }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<Role>(member.role);

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/api/team/${member.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team"] }); setEditing(false); toast.success("Updated"); },
    onError: () => toast.error("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/team/${member.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team"] }); toast.success("Member removed"); },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Remove failed"),
  });

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {member.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-400">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        {editing ? (
          <select value={role} onChange={e => setRole(e.target.value as Role)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        ) : (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor[member.role as Role] ?? "bg-gray-100 text-gray-600"}`}>
            {member.role}
          </span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${member.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? "bg-green-500" : "bg-red-400"}`} />
          {member.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {editing ? (
            <>
              <button onClick={() => updateMutation.mutate({ role })} disabled={updateMutation.isPending}
                className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg text-green-600">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setEditing(false); setRole(member.role); }}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => updateMutation.mutate({ is_active: !member.is_active })}
                title={member.is_active ? "Deactivate" : "Activate"}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditing(true)} title="Change role"
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (confirm(`Remove ${member.name}?`)) deleteMutation.mutate(); }}
                title="Remove member"
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

type BotConfigForm = {
  trigger_keyword: string;
  welcome_message: string;
  menu_header: string;
};

const DEFAULT_BOT_CONFIG: BotConfigForm = {
  trigger_keyword: "",
  welcome_message: "Thanks for reaching out! Our team will be in touch with you shortly.",
  menu_header: "*Welcome!* 👋",
};

function BotMessagesForm({
  config,
  onSave,
  saving,
}: {
  config?: BotConfigForm;
  onSave: (data: BotConfigForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<BotConfigForm>(DEFAULT_BOT_CONFIG);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        trigger_keyword: config.trigger_keyword ?? "",
        welcome_message: config.welcome_message ?? DEFAULT_BOT_CONFIG.welcome_message,
        menu_header: config.menu_header ?? DEFAULT_BOT_CONFIG.menu_header,
      });
      setDirty(false);
    }
  }, [config]);

  const update = (patch: Partial<BotConfigForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Customize the messages your WhatsApp bot sends when customers open the menu or message you for the first time.
      </p>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Menu welcome message</label>
          <p className="text-xs text-gray-400 mb-2">
            Shown at the top when customers type &quot;menu&quot; or browse your catalog. Use *text* for bold, emojis supported.
          </p>
          <textarea
            value={form.menu_header}
            onChange={(e) => update({ menu_header: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. *Welcome to Acme Corp!* 👋"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Fallback welcome message</label>
          <p className="text-xs text-gray-400 mb-2">Sent when a customer messages first and you have no catalog items yet</p>
          <textarea
            value={form.welcome_message}
            onChange={(e) => update({ welcome_message: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Thanks for reaching out! Our team will reply shortly."
          />
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Preview — what customers see in the menu</p>
          <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
            {form.menu_header || DEFAULT_BOT_CONFIG.menu_header}
            {"\n\n"}Reply with a number:
            {"\n"}*1.* Your first catalog item
            {"\n"}*2.* Your second catalog item
            {"\n\n"}Type *menu* anytime to return here.
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            onClick={() => onSave(form)}
            disabled={!dirty || saving || !form.menu_header.trim() || !form.welcome_message.trim()}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save messages"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const [tab, setTab] = useState<string>("team");
  const [showInvite, setShowInvite] = useState(false);
  const qc = useQueryClient();

  const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: () => api.get("/api/team").then((r) => r.data) });
  const { data: apiKeys } = useQuery({ queryKey: ["api-keys"], queryFn: () => api.get("/api/api-keys").then((r) => r.data) });
  const { data: botConfig } = useQuery({ queryKey: ["bot-config"], queryFn: () => api.get("/api/bot/config").then((r) => r.data) });

  const createKeyMutation = useMutation({
    mutationFn: () => api.post("/api/api-keys", { name: `Key ${Date.now()}`, scopes: ["read", "write"] }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast.success(`Key created: ${res.data.raw_key}`); },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast.success("Key revoked"); },
  });

  const botConfigMutation = useMutation({
    mutationFn: (data: any) => api.put("/api/bot/config", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bot-config"] }); toast.success("Messages updated"); },
    onError: () => toast.error("Failed to update messages"),
  });

  const tabs: Array<{ id: string; label: string; icon: any }> = [
    { id: "team", label: "Team", icon: Users },
    { id: "bot-config", label: "Bot messages", icon: Zap },
    { id: "email", label: "Email accounts", icon: Mail },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "api", label: "API keys", icon: Key },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "team" && (
        <div>
          {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{team.length} member{team.length !== 1 ? "s" : ""} on your team</p>
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" /> Invite member
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {team.map((u: any) => <TeamRow key={u.id} member={u} />)}
              </tbody>
            </table>
            {team.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No team members yet — invite someone to get started.</div>
            )}
          </div>
        </div>
      )}

      {tab === "bot-config" && (
        <BotMessagesForm
          config={botConfig}
          saving={botConfigMutation.isPending}
          onSave={(data) => botConfigMutation.mutate(data)}
        />
      )}

      {tab === "api" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">API keys for external integrations. The key is shown once — copy it immediately.</p>
            <button onClick={() => createKeyMutation.mutate()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
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

      {tab === "email" && <EmailAccounts />}
    </div>
  );
}

type EmailAccount = {
  id: string;
  label: string;
  provider: string;
  email_address: string | null;
  last_synced_at: string | null;
  is_active: boolean;
};

function EmailAccounts() {
  const qc = useQueryClient();
  const { data: accounts = [], isLoading } = useQuery<EmailAccount[]>({
    queryKey: ["email-accounts"],
    queryFn: () => api.get("/api/email/accounts").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/email/accounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-accounts"] }); toast.success("Account removed"); },
    onError: () => toast.error("Failed to remove account"),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post("/api/email/sync"),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["email-accounts"] });
      const d = res.data;
      const errs = d.errors?.length ? ` (${d.errors.length} error${d.errors.length > 1 ? "s" : ""})` : "";
      toast.success(`Synced ${d.synced} account${d.synced !== 1 ? "s" : ""}${errs}`);
    },
    onError: () => toast.error("Sync failed"),
  });

  async function connectGmail() {
    try {
      const res = await api.get("/api/email/gmail/authorize");
      window.location.href = res.data.authorize_url;
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Gmail OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env");
    }
  }

  async function connectOutlook() {
    try {
      const res = await api.get("/api/email/outlook/authorize");
      window.location.href = res.data.authorize_url;
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Outlook OAuth not configured. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env");
    }
  }

  const providerBadgeColor: Record<string, string> = {
    gmail: "bg-red-50 text-red-700",
    outlook: "bg-blue-50 text-blue-700",
    imap: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="space-y-5">
      {/* Connect buttons */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Connect an email account</h2>
        <p className="text-sm text-gray-500 mb-4">Use OAuth to connect Gmail or Outlook. Emails from connected accounts will appear in the Inbox automatically.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={connectGmail}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Gmail
          </button>
          <button
            onClick={connectOutlook}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <rect x="0" y="0" width="11" height="11" fill="#F25022"/>
              <rect x="13" y="0" width="11" height="11" fill="#7FBA00"/>
              <rect x="0" y="13" width="11" height="11" fill="#00A4EF"/>
              <rect x="13" y="13" width="11" height="11" fill="#FFB900"/>
            </svg>
            Connect Outlook
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Requires <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_ID</code> / <code className="bg-gray-100 px-1 rounded">MICROSOFT_CLIENT_ID</code> in <code className="bg-gray-100 px-1 rounded">.env</code> — see comments in that file for setup instructions.
        </p>
      </div>

      {/* Connected accounts */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Connected accounts</h2>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || accounts.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing…" : "Sync all"}
          </button>
        </div>
        {isLoading ? (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">No accounts connected yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Account</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Provider</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Last synced</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct) => (
                <tr key={acct.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{acct.label}</p>
                    {acct.email_address && <p className="text-xs text-gray-400">{acct.email_address}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${providerBadgeColor[acct.provider] ?? providerBadgeColor.imap}`}>
                      {acct.provider}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {acct.last_synced_at ? new Date(acct.last_synced_at).toLocaleString() : "Never"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(acct.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

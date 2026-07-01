"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import Badge from "@/shared/components/Badge";
import EmptyState from "@/shared/components/EmptyState";
import { Zap, Plus, Play, Pause, Trash2, MessageSquare, Tag, Clock, X, GripVertical, FlaskConical, Bot, Save } from "lucide-react";
import toast from "react-hot-toast";

type Step = { type: string; config: Record<string, any> };

const STEP_TYPES = [
  { id: "send_whatsapp", label: "Send WhatsApp message", icon: MessageSquare, color: "text-green-600 bg-green-50" },
  { id: "add_tag", label: "Add tag to contact", icon: Tag, color: "text-blue-600 bg-blue-50" },
  { id: "wait", label: "Wait", icon: Clock, color: "text-orange-600 bg-orange-50" },
];

function StepIcon({ type }: { type: string }) {
  const def = STEP_TYPES.find((s) => s.id === type);
  if (!def) return null;
  const Icon = def.icon;
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${def.color}`}>
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}

function StepLabel({ step }: { step: Step }) {
  if (step.type === "send_whatsapp") return <span>Send: <em className="not-italic font-medium">"{step.config.message || "…"}"</em></span>;
  if (step.type === "add_tag") return <span>Add tag: <em className="not-italic font-medium">{step.config.tag || "…"}</em></span>;
  if (step.type === "wait") return <span>Wait <em className="not-italic font-medium">{step.config.seconds || 0}s</em></span>;
  return <span>{step.type}</span>;
}

function StepEditor({ step, onChange, onRemove }: { step: Step; onChange: (s: Step) => void; onRemove: () => void }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
      <StepIcon type={step.type} />
      <div className="flex-1 space-y-2">
        <select
          value={step.type}
          onChange={(e) => onChange({ type: e.target.value, config: {} })}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STEP_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {step.type === "send_whatsapp" && (
          <textarea
            rows={3}
            value={step.config.message || ""}
            onChange={(e) => onChange({ ...step, config: { message: e.target.value } })}
            placeholder="Message to send to the contact…"
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        )}
        {step.type === "add_tag" && (
          <input
            value={step.config.tag || ""}
            onChange={(e) => onChange({ ...step, config: { tag: e.target.value } })}
            placeholder="Tag name, e.g. hot-lead"
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {step.type === "wait" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={300}
              value={step.config.seconds || 5}
              onChange={(e) => onChange({ ...step, config: { seconds: parseInt(e.target.value) || 5 } })}
              className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500">seconds</span>
          </div>
        )}
      </div>
      <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}

const emptyForm = () => ({
  name: "",
  trigger_type: "keyword",
  trigger_config: { keyword: "" },
  steps: [] as Step[],
});

function TestPanel() {
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const simulate = useMutation({
    mutationFn: () => api.post("/api/whatsapp/simulate", { phone, text }),
    onSuccess: () => toast.success(`Simulated "${text}" from ${phone} — check inbox & bot reply`),
    onError: () => toast.error("Simulation failed"),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 border border-dashed border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
        Test simulator
      </button>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Test simulator</span>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-amber-100 rounded">
          <X className="w-3.5 h-3.5 text-amber-500" />
        </button>
      </div>
      <p className="text-xs text-amber-700">Simulates an inbound WhatsApp message — use your own number to test automations without a second phone.</p>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number (e.g. 919876543210)"
          className="flex-1 border border-amber-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message (e.g. hi)"
          className="w-36 border border-amber-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          onClick={() => simulate.mutate()}
          disabled={simulate.isPending || !phone || !text}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {simulate.isPending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

function BotTriggerConfig() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data } = useQuery<{ trigger_keyword: string }>({
    queryKey: ["bot-config"],
    queryFn: () => api.get("/api/bot/config").then(r => r.data),
  });

  useEffect(() => {
    if (data && !initialized) {
      setKeyword(data.trigger_keyword || "");
      setInitialized(true);
    }
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: (kw: string) => api.put("/api/bot/config", { trigger_keyword: kw }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bot-config"] }); toast.success("Bot trigger keyword saved"); },
    onError: () => toast.error("Failed to save"),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-semibold text-gray-900">Bot menu trigger keyword</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        When a customer sends this exact word, the bot will show your catalog menu.
        Any other messages will be regular conversation until this keyword is sent.
        Leave blank to use the default greeting words (hi, hello, hey…).
      </p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Trigger keyword</label>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value.toLowerCase())}
            placeholder="e.g. menu, catalog, services (leave blank for default)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => saveMutation.mutate(keyword.trim())}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {data?.trigger_keyword && (
        <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5 mt-3">
          Active: customers must send "<strong>{data.trigger_keyword}</strong>" to activate the bot menu.
        </p>
      )}
      {!data?.trigger_keyword && initialized && (
        <p className="text-xs text-gray-400 mt-2">
          Default mode: any greeting (hi, hello, hey…) activates the menu.
        </p>
      )}
    </div>
  );
}

export default function AutomationsView() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["automations"],
    queryFn: () => api.get("/api/automations").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/api/automations", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      setShowNew(false);
      setForm(emptyForm());
      toast.success("Automation created");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/api/automations/${id}`, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/automations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Deleted"); },
  });

  const addStep = () =>
    setForm((f) => ({ ...f, steps: [...f.steps, { type: "send_whatsapp", config: { message: "" } }] }));

  const updateStep = (i: number, s: Step) =>
    setForm((f) => { const steps = [...f.steps]; steps[i] = s; return { ...f, steps }; });

  const removeStep = (i: number) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));

  const automations: any[] = data || [];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Automations</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New automation
        </button>
      </div>

      <BotTriggerConfig />

      <div className="mb-5">
        <TestPanel />
      </div>

      {automations.length === 0 ? (
        <EmptyState icon={Zap} title="No automations yet" description="Create automations to send auto-replies or tag contacts when they message a keyword" />
      ) : (
        <div className="space-y-3">
          {automations.map((a: any) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <Badge variant={a.is_active ? "success" : "default"}>{a.is_active ? "active" : "paused"}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMutation.mutate({ id: a.id, active: !a.is_active })}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={a.is_active ? "Pause" : "Activate"}
                  >
                    {a.is_active ? <Pause className="w-4 h-4 text-gray-500" /> : <Play className="w-4 h-4 text-gray-500" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(a.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1 mb-2">
                When someone sends <span className="font-medium text-gray-700">"{a.trigger_config?.keyword}"</span>
                {" · "}{a.steps.length} step{a.steps.length !== 1 ? "s" : ""}
                {" · "}{a.run_count}x triggered
              </p>

              {a.steps.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {a.steps.map((s: Step, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                      <StepIcon type={s.type} />
                      <StepLabel step={s} />
                    </div>
                  ))}
                </div>
              )}

              {a.steps.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 inline-block">
                  No actions — add steps to this automation
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">New automation</h2>
              <button onClick={() => setShowNew(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Automation name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Price inquiry reply"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger keyword</label>
                <input
                  value={form.trigger_config.keyword}
                  onChange={(e) => setForm((f) => ({ ...f, trigger_config: { keyword: e.target.value } }))}
                  placeholder="e.g. price, demo, hi, help"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Fires when an inbound message contains this word</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Actions</label>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add step
                  </button>
                </div>
                {form.steps.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400">No steps yet</p>
                    <button onClick={addStep} className="mt-1 text-xs text-brand-600 hover:underline">Add your first step</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.steps.map((step, i) => (
                      <StepEditor key={i} step={step} onChange={(s) => updateStep(i, s)} onRemove={() => removeStep(i)} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.trigger_config.keyword}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Saving…" : "Save automation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

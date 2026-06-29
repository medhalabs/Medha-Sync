"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import EmptyState from "@/shared/components/EmptyState";
import { GitBranch, Plus, X, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import {
  DndContext, closestCenter, DragEndEvent,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STAGE_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899"];

function DealCard({ deal, stages, onMove, onDelete }: { deal: any; stages: any[]; onMove: (id: string, stageId: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium text-gray-900 flex-1">{deal.title}</p>
        <button onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 text-gray-400 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {deal.value != null && (
        <p className="text-xs text-gray-500 mt-1">₹{Number(deal.value).toLocaleString()}</p>
      )}
      <select
        value={deal.stage_id}
        onChange={(e) => { e.stopPropagation(); onMove(deal.id, e.target.value); }}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 w-full text-xs border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-600 focus:outline-none cursor-pointer"
      >
        {stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );
}

export default function PipelineView() {
  const qc = useQueryClient();
  const [showAddDeal, setShowAddDeal] = useState<string | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [editStage, setEditStage] = useState<any>(null);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [dealForm, setDealForm] = useState({ title: "", value: "", notes: "" });
  const [stageForm, setStageForm] = useState({ name: "", color: STAGE_COLORS[0] });
  const [editStageForm, setEditStageForm] = useState({ name: "", color: STAGE_COLORS[0] });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: stages } = useQuery({ queryKey: ["stages"], queryFn: () => api.get("/api/pipeline/stages").then(r => r.data) });
  const { data: deals } = useQuery({ queryKey: ["deals"], queryFn: () => api.get("/api/pipeline/deals").then(r => r.data) });

  const addDeal = useMutation({
    mutationFn: (data: any) => api.post("/api/pipeline/deals", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); setShowAddDeal(null); setDealForm({ title: "", value: "", notes: "" }); toast.success("Deal added"); },
  });

  const moveDeal = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) => api.patch(`/api/pipeline/deals/${dealId}`, { stage_id: stageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => api.delete(`/api/pipeline/deals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); toast.success("Deal deleted"); },
  });

  const addStage = useMutation({
    mutationFn: (data: any) => api.post("/api/pipeline/stages", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stages"] }); setShowAddStage(false); setStageForm({ name: "", color: STAGE_COLORS[0] }); toast.success("Stage added"); },
  });

  const updateStage = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/pipeline/stages/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stages"] }); setEditStage(null); toast.success("Stage updated"); },
  });

  const deleteStage = useMutation({
    mutationFn: (id: string) => api.delete(`/api/pipeline/stages/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stages"] }); qc.invalidateQueries({ queryKey: ["deals"] }); setDeleteStageId(null); toast.success("Stage deleted"); },
  });

  const stageList: any[] = stages || [];
  const dealList: any[] = deals || [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const targetDeal = dealList.find(d => d.id === over.id);
    const targetStage = stageList.find(s => s.id === over.id);
    const newStageId = targetDeal?.stage_id || targetStage?.id;
    if (newStageId) moveDeal.mutate({ dealId: String(active.id), stageId: newStageId });
  }

  const openEditStage = (stage: any) => {
    setEditStage(stage);
    setEditStageForm({ name: stage.name, color: stage.color });
  };

  const stageToDelete = stageList.find(s => s.id === deleteStageId);
  const dealsInStage = dealList.filter(d => d.stage_id === deleteStageId).length;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <button onClick={() => setShowAddStage(true)}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          <Plus className="w-4 h-4" /> Add stage
        </button>
      </div>

      {stageList.length === 0 ? (
        <EmptyState icon={GitBranch} title="No pipeline stages yet"
          description="Add stages like Lead → Qualified → Proposal → Won"
          action={<button onClick={() => setShowAddStage(true)} className="text-sm text-brand-500 hover:underline">Create first stage</button>} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {stageList.map((stage: any) => {
              const stageDeals = dealList.filter((d: any) => d.stage_id === stage.id);
              return (
                <div key={stage.id} className="flex-shrink-0 w-64">
                  <div className="flex items-center gap-2 mb-3 group">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{stage.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{stageDeals.length}</span>
                    <button
                      onClick={() => openEditStage(stage)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-all"
                      title="Edit stage"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteStageId(stage.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-all"
                      title="Delete stage"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 min-h-16">
                      {stageDeals.map((deal: any) => (
                        <DealCard key={deal.id} deal={deal} stages={stageList}
                          onMove={(id, sid) => moveDeal.mutate({ dealId: id, stageId: sid })}
                          onDelete={(id) => deleteDeal.mutate(id)} />
                      ))}
                    </div>
                  </SortableContext>
                  <button onClick={() => setShowAddDeal(stage.id)}
                    className="mt-2 w-full flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add deal
                  </button>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Add Deal Modal */}
      {showAddDeal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddDeal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">Add deal</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={dealForm.title} onChange={e => setDealForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. John Smith - Website project"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value (₹)</label>
                <input type="number" value={dealForm.value} onChange={e => setDealForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={dealForm.notes} onChange={e => setDealForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddDeal(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => addDeal.mutate({ stage_id: showAddDeal, title: dealForm.title, value: dealForm.value ? parseFloat(dealForm.value) : null, notes: dealForm.notes || null })}
                disabled={!dealForm.title || addDeal.isPending}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {addDeal.isPending ? "Adding…" : "Add deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stage Modal */}
      {showAddStage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddStage(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">Add stage</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage name *</label>
                <input value={stageForm.name} onChange={e => setStageForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Qualified, Proposal, Won"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {STAGE_COLORS.map(c => (
                    <button key={c} onClick={() => setStageForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${stageForm.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddStage(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => addStage.mutate({ name: stageForm.name, color: stageForm.color, position: stageList.length })}
                disabled={!stageForm.name || addStage.isPending}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {addStage.isPending ? "Adding…" : "Add stage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stage Modal */}
      {editStage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditStage(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">Edit stage</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage name *</label>
                <input value={editStageForm.name} onChange={e => setEditStageForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {STAGE_COLORS.map(c => (
                    <button key={c} onClick={() => setEditStageForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${editStageForm.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditStage(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => updateStage.mutate({ id: editStage.id, data: editStageForm })}
                disabled={!editStageForm.name || updateStage.isPending}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {updateStage.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stage Confirmation */}
      {deleteStageId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteStageId(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-2">Delete stage?</h2>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete <strong>{stageToDelete?.name}</strong>?
            </p>
            {dealsInStage > 0 && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
                This will also delete {dealsInStage} deal{dealsInStage !== 1 ? "s" : ""} in this stage.
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteStageId(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => deleteStage.mutate(deleteStageId)}
                disabled={deleteStage.isPending}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {deleteStage.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import EmptyState from "@/shared/components/EmptyState";
import { GitBranch, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function PipelineView() {
  const qc = useQueryClient();

  const { data: stages } = useQuery({
    queryKey: ["stages"],
    queryFn: () => api.get("/api/pipeline/stages").then((r) => r.data),
  });

  const { data: deals } = useQuery({
    queryKey: ["deals"],
    queryFn: () => api.get("/api/pipeline/deals").then((r) => r.data),
  });

  const moveDeal = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      api.patch(`/api/pipeline/deals/${dealId}`, { stage_id: stageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
    onError: () => toast.error("Failed to move deal"),
  });

  const stageList: any[] = stages || [];
  const dealList: any[] = deals || [];

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
        <button className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" />
          Add deal
        </button>
      </div>

      {stageList.length === 0 ? (
        <EmptyState icon={GitBranch} title="No pipeline stages" description="Create stages to start tracking deals" />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {stageList.map((stage: any) => {
            const stageDeals = dealList.filter((d: any) => d.stage_id === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{stageDeals.length}</span>
                </div>
                <div className="space-y-2 min-h-20">
                  {stageDeals.map((deal: any) => (
                    <div key={deal.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      {deal.value && <p className="text-xs text-gray-500 mt-1">₹{Number(deal.value).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

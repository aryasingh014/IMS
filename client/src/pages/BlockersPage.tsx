import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Blocker } from '../types';
import { useApp } from '../context/AppContext';

export const BlockersPage: React.FC = () => {
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshSummary, showToast, currentRole, currentUser } = useApp();

  useEffect(() => {
    fetchBlockers();
  }, []);

  const fetchBlockers = async () => {
    setLoading(true);
    try {
      const res = await api.getBlockers();
      setBlockers(res.blockers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayedBlockers = currentRole === 'INTERN'
    ? blockers.filter((b) => b.intern?.name?.toLowerCase().includes('rahul') || b.intern?.email === currentUser.email)
    : currentRole === 'TEAM_LEAD'
    ? blockers.filter((b) => b.intern?.project?.name === 'GLC AI Lead Intelligence' || (b.intern as any)?.project?.projectLead?.toLowerCase().includes('vikram') || b.intern?.name === 'Rahul Kumar')
    : blockers;

  const handleResolveBlocker = async (id: string) => {
    try {
      await api.resolveBlocker(id);
      fetchBlockers();
      refreshSummary();
      showToast('Blocker resolved and intern status updated to WORKING!');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Active Blockers...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Blockers Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational bottlenecks requiring senior engineering guidance or permission updates.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{displayedBlockers.length} Active Operational Blockers</span>
        </div>
      </div>

      <div className="space-y-3">
        {displayedBlockers.map((blocker) => (

          <div
            key={blocker.id}
            className="bg-white border border-rose-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{blocker.intern?.name}</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {blocker.intern?.project?.name}
                </span>
              </div>
              <p className="text-xs text-rose-700 font-semibold">{blocker.description}</p>
              <p className="text-[10px] text-slate-500">
                Blocked since: {blocker.reportedDate ? new Date(blocker.reportedDate).toLocaleString() : 'Recently'}

              </p>
            </div>

            <button
              onClick={() => handleResolveBlocker(blocker.id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm self-start sm:self-center"
            >
              <CheckCircle className="w-4 h-4" /> Resolve Blocker
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

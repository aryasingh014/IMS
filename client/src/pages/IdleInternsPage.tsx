import React, { useState, useEffect } from 'react';
import { Clock, UserPlus, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Intern } from '../types';
import { useApp } from '../context/AppContext';

export const IdleInternsPage: React.FC = () => {
  const [idleInterns, setIdleInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const { setIsQuickActionOpen, currentRole, currentUser } = useApp();

  useEffect(() => {
    fetchIdleInterns();
  }, []);

  const fetchIdleInterns = async () => {
    setLoading(true);
    try {
      const res = await api.getIdleInterns();
      setIdleInterns(res.idleInterns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayedIdleInterns = currentRole === 'INTERN'
    ? idleInterns.filter((i) => i.name?.toLowerCase().includes('rahul') || i.email === currentUser.email)
    : currentRole === 'TEAM_LEAD'
    ? idleInterns.filter((i) => i.project?.name === 'GLC AI Lead Intelligence' || (i.project as any)?.projectLead?.toLowerCase().includes('vikram') || i.name === 'Rahul Kumar')
    : idleInterns;

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Detecting Idle Interns...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">No Task / Idle Intern Detection</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of interns who currently have 0 active tasks or completed prior tickets.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{displayedIdleInterns.length} Interns Available for Work</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedIdleInterns.map((intern) => (

          <div
            key={intern.id}
            className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{intern.name}</h3>
                  <p className="text-xs text-slate-500">{intern.email}</p>
                </div>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                  IDLE / NO TASK
                </span>
              </div>

              <div className="mt-4 space-y-1 text-xs">
                <p className="text-slate-600">Project: <strong className="text-slate-900">{intern.project?.name || 'Unassigned'}</strong></p>
                <p className="text-slate-600">Module: <strong className="text-slate-900">{intern.module || 'General'}</strong></p>
              </div>
            </div>

            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> 1-Click Assign Ticket
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

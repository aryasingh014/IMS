import React, { useState, useEffect } from 'react';
import { UsersRound, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { Team } from '../types';

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.getTeams();
      setTeams(res.teams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Teams Overview...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Teams & Team Lead Oversight</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Engineering squad breakdown and assigned lead responsibilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">{t.name}</h3>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                {t.interns?.length || 0} Members
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Lead: {t.teamLead?.name || 'Unassigned'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

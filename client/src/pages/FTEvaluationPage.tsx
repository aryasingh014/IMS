import React, { useState, useEffect } from 'react';
import { Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { FTEvaluation } from '../types';

import { useApp } from '../context/AppContext';

export const FTEvaluationPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentRole } = useApp();

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await api.getFTEvaluations();
      setEvaluations(res.evaluations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayedEvaluations = currentRole === 'TEAM_LEAD'
    ? evaluations.filter((ev) => ev.project?.name === 'GLC AI Lead Intelligence' || ev.intern?.project?.name === 'GLC AI Lead Intelligence' || ev.name?.toLowerCase().includes('rahul') || ev.intern?.name?.toLowerCase().includes('rahul'))
    : evaluations;

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading FTE Candidates Pipeline...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Full-Time Employment (FTE) Pipeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          High-potential candidates recommended for full-time offer conversion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedEvaluations.map((ev) => (

          <div key={ev.id} className="bg-white border border-purple-200 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{ev.name || ev.intern?.name}</h3>
                <p className="text-xs text-slate-500">{ev.project?.name || ev.intern?.project?.name} • {ev.email || ev.intern?.email}</p>
              </div>
              <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full text-xs border border-purple-200">
                {ev.ftPotential || ev.potentialLevel || 'Strong Potential'}
              </span>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              "{ev.evidence || ev.learningEvidence || 'Demonstrated consistent high performance and technical leadership.'}"
            </p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Technical Ability Score:</span>
              <span className="font-bold text-slate-900">{ev.technicalAbility ? `${ev.technicalAbility * 20}/100` : '90/100'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

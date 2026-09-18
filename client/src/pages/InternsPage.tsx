import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, Award, X, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Intern } from '../types';
import { useApp } from '../context/AppContext';

export const InternsPage: React.FC = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ftFilter, setFtFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { selectedInternId, setSelectedInternId, currentRole, currentUser } = useApp();
  const [internDetail, setInternDetail] = useState<Intern | null>(null);

  useEffect(() => {
    fetchInterns();
  }, [search, statusFilter, ftFilter]);

  useEffect(() => {
    if (selectedInternId) {
      fetchInternDetail(selectedInternId);
    } else {
      setInternDetail(null);
    }
  }, [selectedInternId]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (ftFilter) params.ftPotential = ftFilter;
      const res = await api.getInterns(params);

      setInterns(res.interns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternDetail = async (id: string) => {
    try {
      const res = await api.getInternById(id);
      setInternDetail(res.intern);
    } catch (err) {
      console.error(err);
    }
  };

  const displayedInterns = currentRole === 'TEAM_LEAD'
    ? interns.filter((i) => i.project?.name === 'GLC AI Lead Intelligence' || (i.project as any)?.projectLead?.toLowerCase().includes('vikram'))
    : interns;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Intern Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full list of {displayedInterns.length} assigned interns, performance logs, and status records.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 pl-8 pr-3 py-1.5 rounded-xl text-xs w-64 shadow-2xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Working">Working</option>
            <option value="Blocked">Blocked</option>
            <option value="No Task">No Task / Idle</option>
            <option value="Waiting Review">Review Queue</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={ftFilter}
            onChange={(e) => setFtFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs font-medium"
          >
            <option value="">FT Suitability</option>
            <option value="Strong Potential">Strong Potential</option>
            <option value="Potential">Potential</option>
            <option value="Needs Observation">Needs Observation</option>
          </select>
        </div>
      </div>

      {/* Interns Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Intern Name</th>
                <th className="p-4">Project / Team</th>
                <th className="p-4">Module</th>
                <th className="p-4">Status</th>
                <th className="p-4">Current Task</th>
                <th className="p-4">FT Suitability</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedInterns.map((intern) => {

                const activeTask = intern.tasks?.[0];
                return (
                  <tr
                    key={intern.id}
                    onClick={() => setSelectedInternId(intern.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{intern.name}</p>
                      <p className="text-[10px] text-slate-500">{intern.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-700">{intern.project?.name || 'Unassigned'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                        {intern.module || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          intern.status === 'Working'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : intern.status === 'Blocked'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : intern.status === 'No Task'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {intern.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-600">
                      {activeTask ? activeTask.description : <span className="text-slate-400 italic">No active task</span>}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          intern.ftPotential === 'Strong Potential'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : intern.ftPotential === 'Potential'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {intern.ftPotential || 'Needs Review'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-sky-600 hover:text-sky-700 font-semibold text-xs">
                        View Profile →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERN PROFILE DRAWER */}
      {internDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white border-l border-slate-200 w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-sm">
                  {internDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{internDetail.name}</h3>
                  <p className="text-xs text-slate-500">{internDetail.email} • {internDetail.project?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInternId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
              {/* Status Badge */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className="font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  {internDetail.status}
                </span>
              </div>

              {/* Performance Radar Metrics */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Performance Ratings
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Learning Speed: <strong className="text-slate-900">{internDetail.learningSpeed}/5</strong></div>
                  <div>Technical Ability: <strong className="text-slate-900">{internDetail.technicalAbility}/5</strong></div>
                  <div>Independence: <strong className="text-slate-900">{internDetail.ownership}/5</strong></div>
                  <div>Consistency: <strong className="text-slate-900">{internDetail.consistency}/5</strong></div>
                </div>
              </div>

              {/* Activity History Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">Activity History Timeline</h4>
                <div className="space-y-2 border-l-2 border-slate-200 pl-4">
                  {internDetail.dailyUpdates?.map((u) => (
                    <div key={u.id} className="relative pb-3">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white" />
                      <p className="font-bold text-slate-900">{u.todayTask}</p>
                      <p className="text-[10px] text-slate-500">{u.date}</p>
                      {u.blocker && <p className="text-rose-600 font-medium mt-0.5">Blocker: {u.blocker}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

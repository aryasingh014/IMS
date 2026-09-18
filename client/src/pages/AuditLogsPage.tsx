import React, { useState, useEffect } from 'react';
import { History, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { useApp } from '../context/AppContext';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { showToast, refreshSummary } = useApp();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all demo data back to factory seeds?')) return;
    setResetting(true);
    try {
      await api.resetDemoData();
      showToast('Demo data re-seeded successfully!');
      fetchLogs();
      refreshSummary();
    } catch (err: any) {
      alert('Reset error: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading System Audit Logs...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Logs & Controls</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track user state modifications, integration runs, and demo database reset triggers.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={resetting}
          className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting Demo Data...' : 'Reset Demo Data'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Details</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{log.action}</td>
                <td className="p-4 font-mono text-[11px] text-slate-600">{log.entityType}</td>
                <td className="p-4 text-slate-700">{log.details}</td>
                <td className="p-4 font-mono text-[10px] text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

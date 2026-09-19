import React, { useState, useEffect } from 'react';
import { CalendarCheck, Send, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { api } from '../services/api';
import { DailyUpdate } from '../types';
import { useApp } from '../context/AppContext';

export const DailyUpdatesPage: React.FC = () => {
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [todayTask, setTodayTask] = useState('TSK-201: Implement FastAPI Integration & Unit Tests');
  const [completedToday, setCompletedToday] = useState('');
  const [pending, setPending] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);
  const [blocker, setBlocker] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blockerError, setBlockerError] = useState('');

  const { currentRole, currentUser, showToast, refreshSummary } = useApp();

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await api.getDailyUpdates();
      setUpdates(res.updates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayedUpdates = updates;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasBlocker && !blocker.trim()) {
      setBlockerError('Please specify the exact technical blocker/dependency before submitting.');
      return;
    }
    setBlockerError('');

    setSubmitting(true);
    try {
      const res = await api.submitDailyUpdate({
        internId: (currentUser as any).internId || 'INT-1001',
        todayTask,
        completedToday: completedToday || 'Worked on core tasks and unit testing.',
        pending: pending || 'Finalizing integration documentation.',
        blocker: hasBlocker ? blocker : undefined,
      });


      showToast('Daily update submitted successfully!');
      setCompletedToday('');
      setPending('');
      setHasBlocker(false);
      setBlocker('');
      fetchUpdates();
      refreshSummary();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to submit daily update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Daily Updates Feed...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submit Daily Progress Update</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Record your daily progress, accomplishments, hours worked, and any blockers faced.
        </p>
      </div>

      {/* Interactive Submission Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 max-w-4xl">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CalendarCheck className="w-5 h-5 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Log Today's Work Summary</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Today's Focus / Ticket</label>
              <input
                type="text"
                required
                value={todayTask}
                onChange={(e) => setTodayTask(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
                placeholder="e.g. TSK-201: Implement FastAPI Integration"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Intern Name</label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.title})`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Completed Work Accomplishments Today</label>
            <textarea
              rows={2}
              required
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              placeholder="e.g. Built unit tests for OAuth token endpoint and passed 14/14 test cases."
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Pending Tasks & Next Steps for Tomorrow</label>
            <textarea
              rows={2}
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              placeholder="e.g. Deploy endpoints to staging and conduct code review with Vikram Malhotra."
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
            />
          </div>

          {/* Blocker Flag Toggle */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={hasBlocker}
                  onChange={(e) => {
                    setHasBlocker(e.target.checked);
                    if (!e.target.checked) setBlockerError('');
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <AlertCircle className="w-4 h-4" /> Are you facing any technical blocker today?
                </span>
              </label>
            </div>

            {hasBlocker && (
              <div className="space-y-1">
                <textarea
                  rows={2}
                  value={blocker}
                  onChange={(e) => {
                    setBlocker(e.target.value);
                    if (e.target.value.trim()) setBlockerError('');
                  }}
                  placeholder="Describe the exact blocker or dependency preventing task completion..."
                  className="w-full bg-rose-50/50 border border-rose-200 focus:border-rose-500 rounded-xl p-2.5 text-slate-800 font-medium placeholder:text-rose-400"
                />
                {blockerError && <p className="text-[11px] font-semibold text-rose-600">{blockerError}</p>}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Update...' : 'Submit Daily Update Now'}
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Updates Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Recent Submitted Daily Updates</h3>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          {displayedUpdates.map((update) => (

            <div
              key={update.id}
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-slate-900">{update.intern?.name || 'Intern'}</span>
                  <span className="text-slate-500 text-[11px] ml-2">({update.intern?.project?.name || 'Assigned Project'})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {update.date ? new Date(update.date).toLocaleString() : 'Today'}
                </span>
              </div>

              <div className="space-y-1 text-slate-700">
                <p><strong>Today's Task:</strong> {update.todayTask}</p>
                {update.completedToday && <p><strong className="text-emerald-700">Completed:</strong> {update.completedToday}</p>}
                {update.blocker && <p><strong className="text-rose-600">Blocker:</strong> {update.blocker}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

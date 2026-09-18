import React, { useState, useEffect } from 'react';
import { CheckSquare, LayoutGrid, List, AlertCircle, Clock, Plus, Search } from 'lucide-react';
import { api } from '../services/api';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { BlockerReasonModal } from '../components/modals/BlockerReasonModal';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [loading, setLoading] = useState(true);
  const [blockingTask, setBlockingTask] = useState<Task | null>(null);
  const { setIsQuickActionOpen, refreshSummary, showToast, currentRole, currentUser } = useApp();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks();
      setTasks(res.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayedTasks = currentRole === 'INTERN'
    ? tasks.filter((t) => t.intern?.name?.toLowerCase().includes('rahul') || t.intern?.email === currentUser.email)
    : currentRole === 'TEAM_LEAD'
    ? tasks.filter((t) => t.project?.name === 'GLC AI Lead Intelligence' || (t.project as any)?.projectLead?.toLowerCase().includes('vikram') || (t.intern as any)?.project?.name === 'GLC AI Lead Intelligence')
    : tasks;



  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    if (newStatus === 'Blocked') {
      setBlockingTask(task);
      return;
    }

    try {
      await api.updateTask(task.id, { status: newStatus });
      fetchTasks();
      refreshSummary();
      showToast(`Task status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBlocker = async (reason: string) => {
    if (!blockingTask) return;
    try {
      await api.updateTask(blockingTask.id, { status: 'Blocked', notes: reason });
      await api.createBlocker({
        internId: blockingTask.internId,
        description: reason,
      });
      setBlockingTask(null);
      fetchTasks();
      refreshSummary();
      showToast('Task marked as Blocked & Blocker recorded!');
    } catch (err) {
      console.error(err);
    }
  };

  const kanbanColumns: { id: Task['status']; label: string; bg: string }[] = [
    { id: 'Working', label: 'Working', bg: 'bg-emerald-50/50 border-emerald-200' },
    { id: 'Blocked', label: 'Blocked', bg: 'bg-rose-50/50 border-rose-200' },
    { id: 'Waiting Review', label: 'Waiting Review', bg: 'bg-purple-50/50 border-purple-200' },
    { id: 'Completed', label: 'Completed', bg: 'bg-sky-50/50 border-sky-200' },
  ];

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Tasks Kanban...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentRole === 'INTERN' ? 'My Assigned Tickets' : 'Task Execution & Kanban'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'INTERN'
              ? 'View and update your active engineering tickets.'
              : 'Manage live task progress, priority tags, and status transitions across 40 interns.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          {currentRole !== 'INTERN' && (
            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20"
            >
              <Plus className="w-4 h-4" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = displayedTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`bg-white border p-4 rounded-2xl ${col.bg} shadow-xs space-y-3`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{col.label}</h3>
                  <span className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full text-xs shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-slate-200 hover:border-sky-300 p-3.5 rounded-xl shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {task.project?.name || 'Task'}
                        </span>
                        {task.priority === 'Urgent' && (
                          <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 animate-pulse">
                            URGENT
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-xs text-slate-900 leading-snug">{task.description}</p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>Assigned To: <strong className="text-slate-800">{task.intern?.name}</strong></span>
                          <span className="font-bold text-slate-800">{task.progress}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          <span>Assigned By: <strong className="text-slate-700">{task.assignedBy || task.project?.projectLead || task.reviewer || 'Vikram Malhotra'}</strong></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden mt-1">
                          <div className="bg-sky-500 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium rounded p-1"
                        >
                          <option value="Working">Working</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Waiting Review">Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-4">Task Description</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4">Assigned By</th>
                <th className="p-4">Project</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-900">{task.description}</td>
                  <td className="p-4 text-slate-700">{task.intern?.name}</td>
                  <td className="p-4 font-semibold text-sky-800">{task.assignedBy || task.project?.projectLead || task.reviewer || 'Vikram Malhotra'}</td>
                  <td className="p-4 text-slate-600">{task.project?.name}</td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800">{task.priority}</span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{task.progress}%</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{task.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mandatory Blocker Reason Modal */}
      <BlockerReasonModal
        isOpen={!!blockingTask}
        onClose={() => setBlockingTask(null)}
        onSubmit={handleConfirmBlocker}
        taskTitle={blockingTask?.description}
      />
    </div>
  );
};


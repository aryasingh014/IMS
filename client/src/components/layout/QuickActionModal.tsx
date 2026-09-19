import React, { useState, useEffect } from 'react';
import { X, CheckSquare, UserPlus, FolderPlus, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Intern, Project } from '../../types';

export const QuickActionModal: React.FC = () => {
  const { isQuickActionOpen, setIsQuickActionOpen, refreshSummary, showToast, currentRole } = useApp();

  const [activeForm, setActiveForm] = useState<'task' | 'intern' | 'project' | 'update'>('task');
  const [interns, setInterns] = useState<Intern[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    internId: '',
    projectId: '',
    description: '',
    module: '',
    priority: 'Medium',
    deadline: '',
  });

  // Intern form state
  const [internForm, setInternForm] = useState({
    name: '',
    email: '',
    phone: '',
    module: '',
    projectId: '',
  });

  // Project form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    projectLead: '',
    description: '',
  });

  // Daily Update form state
  const [updateForm, setUpdateForm] = useState({
    internId: '',
    todayTask: '',
    completedToday: '',
    blocker: '',
  });

  useEffect(() => {
    if (currentRole === 'INTERN') {
      setActiveForm('update');
    } else {
      setActiveForm('task');
    }
  }, [currentRole, isQuickActionOpen]);

  useEffect(() => {
    if (isQuickActionOpen) {
      api.getInterns().then((res) => {
        setInterns(res.interns);
        if (res.interns.length > 0) {
          setTaskForm((prev) => ({ ...prev, internId: res.interns[0].id }));
          setUpdateForm((prev) => ({ ...prev, internId: res.interns[0].id }));
        }
      });

      api.getProjects().then((res) => {
        setProjects(res.projects);
        if (res.projects.length > 0) {
          setTaskForm((prev) => ({ ...prev, projectId: res.projects[0].id }));
          setInternForm((prev) => ({ ...prev, projectId: res.projects[0].id }));
        }
      });
    }
  }, [isQuickActionOpen]);

  if (!isQuickActionOpen) return null;

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.description || !taskForm.internId || !taskForm.projectId) {
      alert('Please fill description, intern, and project');
      return;
    }

    setLoading(true);
    try {
      await api.createTask({
        ...taskForm,
        priority: taskForm.priority as 'Low' | 'Medium' | 'High' | 'Urgent',
      });
      await refreshSummary();
      showToast('Task assigned successfully!');
      setIsQuickActionOpen(false);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInternSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internForm.name || !internForm.email) {
      alert('Please fill intern name and email');
      return;
    }

    setLoading(true);
    try {
      await api.createIntern(internForm);
      await refreshSummary();
      showToast(`Intern ${internForm.name} created!`);
      setIsQuickActionOpen(false);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.projectLead) {
      alert('Please fill project name and lead');
      return;
    }

    setLoading(true);
    try {
      await api.createProject(projectForm);
      await refreshSummary();
      showToast(`Project ${projectForm.name} created!`);
      setIsQuickActionOpen(false);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm.todayTask || !updateForm.internId) {
      alert('Please fill today task and select intern');
      return;
    }

    setLoading(true);
    try {
      await api.submitDailyUpdate(updateForm);
      await refreshSummary();
      showToast('Daily update recorded!');
      setIsQuickActionOpen(false);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>
          <button onClick={() => setIsQuickActionOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 text-xs">
          {currentRole !== 'INTERN' && (
            <button
              onClick={() => setActiveForm('task')}
              className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                activeForm === 'task' ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Assign Task
            </button>
          )}
          {currentRole === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveForm('intern')}
                className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                  activeForm === 'intern' ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Add Intern
              </button>
              <button
                onClick={() => setActiveForm('project')}
                className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                  activeForm === 'project' ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderPlus className="w-4 h-4" /> Add Project
              </button>
            </>
          )}
          <button
            onClick={() => setActiveForm('update')}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
              activeForm === 'update' ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" /> Record Log
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 text-xs">
          {activeForm === 'task' && (
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Assign To Intern</label>
                <select
                  value={taskForm.internId}
                  onChange={(e) => setTaskForm({ ...taskForm, internId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  {interns.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Project</label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Task Description</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="e.g. Build OAuth token verification middleware and unit tests"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Deadline</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
              >
                {loading ? 'Assigning...' : 'Assign Task Now'}
              </button>
            </form>
          )}

          {activeForm === 'intern' && (
            <form onSubmit={handleInternSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  value={internForm.name}
                  onChange={(e) => setInternForm({ ...internForm, name: e.target.value })}
                  placeholder="Rahul Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  value={internForm.email}
                  onChange={(e) => setInternForm({ ...internForm, email: e.target.value })}
                  placeholder="rahul.kumar@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
              >
                {loading ? 'Adding...' : 'Add Intern'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

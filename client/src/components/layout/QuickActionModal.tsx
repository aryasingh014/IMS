import React, { useState, useEffect } from 'react';
import { X, CheckSquare, UserPlus, FolderPlus, Calendar, Users, Filter, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Intern, Project } from '../../types';

export const QuickActionModal: React.FC = () => {
  const { isQuickActionOpen, setIsQuickActionOpen, refreshSummary, showToast, currentRole, currentUser } = useApp();

  const [activeForm, setActiveForm] = useState<'task' | 'intern' | 'project' | 'update'>('task');
  const [interns, setInterns] = useState<Intern[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamLeads, setTeamLeads] = useState<string[]>([]);
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

  // Project form state with Co-Leads and Squad Interns
  const [projectForm, setProjectForm] = useState({
    name: '',
    projectLead: '',
    description: '',
    targetCompletion: 100,
  });
  const [selectedCoLeads, setSelectedCoLeads] = useState<string[]>([]);
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([]);
  const [internFilter, setInternFilter] = useState<'all' | 'idle' | 'squad'>('idle');
  const [internSearch, setInternSearch] = useState('');

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

      api.getTeams().then((res) => {
        const leads = Array.from(new Set(res.teams.map((t: any) => t.leadName).filter(Boolean))) as string[];
        setTeamLeads(leads);
      });

      setProjectForm((prev) => ({
        ...prev,
        projectLead: currentRole === 'TEAM_LEAD' ? currentUser.name : prev.projectLead || 'Admin Team Lead',
      }));
      setSelectedCoLeads([]);
      setSelectedInternIds([]);
    }
  }, [isQuickActionOpen, currentRole, currentUser]);

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
    if (!projectForm.name) {
      alert('Please fill project name');
      return;
    }

    setLoading(true);
    try {
      // ponytail: single dispatch creating project with co-leads and assigned squad interns
      await api.createProject({
        ...projectForm,
        projectLead: projectForm.projectLead || currentUser.name,
        coLeads: selectedCoLeads.join(', '),
        internIds: selectedInternIds,
      });
      await refreshSummary();
      showToast(`Project "${projectForm.name}" created with ${selectedInternIds.length} interns!`);
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

  const toggleCoLead = (lead: string) => {
    setSelectedCoLeads((prev) =>
      prev.includes(lead) ? prev.filter((l) => l !== lead) : [...prev, lead]
    );
  };

  const toggleIntern = (id: string) => {
    setSelectedInternIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered interns list for project creator
  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(internSearch.toLowerCase()) ||
      (intern.module && intern.module.toLowerCase().includes(internSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (internFilter === 'idle') {
      return intern.status === 'No Task';
    }
    if (internFilter === 'squad') {
      return (intern as any).team?.leadName === currentUser.name || intern.status === 'No Task';
    }
    return true;
  });

  const idleCount = interns.filter((i) => i.status === 'No Task').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
            <button
              onClick={() => setActiveForm('intern')}
              className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                activeForm === 'intern' ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Add Intern
            </button>
          )}
          {(currentRole === 'ADMIN' || currentRole === 'TEAM_LEAD') && (
            <button
              onClick={() => setActiveForm('project')}
              className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                activeForm === 'project' ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderPlus className="w-4 h-4" /> Add Project
            </button>
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
        <div className="p-5 text-xs overflow-y-auto">
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

          {activeForm === 'project' && (
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="e.g. ERP Invoice Module"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Primary Lead</label>
                  <input
                    type="text"
                    value={projectForm.projectLead}
                    onChange={(e) => setProjectForm({ ...projectForm, projectLead: e.target.value })}
                    disabled={currentRole === 'TEAM_LEAD'}
                    placeholder="Admin / Team Lead"
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 disabled:opacity-80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Project Description</label>
                <textarea
                  rows={2}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Brief project goals, target milestones, and tech stack"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Co-Leads Selection */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-medium flex items-center justify-between">
                  <span>🤝 Add Co-Leads (Multi-Lead Collaboration)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Selected: {selectedCoLeads.length}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-24 overflow-y-auto">
                  {teamLeads.length === 0 ? (
                    <span className="text-slate-400 text-[11px]">No other team leads registered</span>
                  ) : (
                    teamLeads
                      .filter((lead) => lead !== projectForm.projectLead)
                      .map((lead) => {
                        const isSelected = selectedCoLeads.includes(lead);
                        return (
                          <button
                            type="button"
                            key={lead}
                            onClick={() => toggleCoLead(lead)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-purple-600" />}
                            {lead}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Smart Squad & Idle Intern Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-medium">
                    👥 Select Squad Interns ({selectedInternIds.length} Selected)
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setInternFilter('idle')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        internFilter === 'idle'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      🟢 Idle ({idleCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternFilter('squad')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        internFilter === 'squad'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      My Squad
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternFilter('all')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        internFilter === 'all'
                          ? 'bg-slate-200 text-slate-900 border-slate-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      All ({interns.length})
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={internSearch}
                  onChange={(e) => setInternSearch(e.target.value)}
                  placeholder="🔍 Search intern name or skill/module..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 text-xs"
                />

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {filteredInterns.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">No matching interns found</div>
                  ) : (
                    filteredInterns.map((intern) => {
                      const isChecked = selectedInternIds.includes(intern.id);
                      return (
                        <div
                          key={intern.id}
                          onClick={() => toggleIntern(intern.id)}
                          className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                            isChecked ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-sky-600 focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <p className="font-semibold text-slate-900 text-[11px] leading-tight">{intern.name}</p>
                              <p className="text-[10px] text-slate-500">{intern.module || 'General'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                intern.status === 'No Task'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : intern.status === 'Blocked'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {intern.status === 'No Task' ? '🟢 Idle' : intern.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2 shadow-sm"
              >
                {loading ? 'Creating Project...' : `Create Project & Assign ${selectedInternIds.length} Interns`}
              </button>
            </form>
          )}

          {activeForm === 'update' && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Intern</label>
                <select
                  value={updateForm.internId}
                  onChange={(e) => setUpdateForm({ ...updateForm, internId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  {interns.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Today's Task</label>
                <input
                  type="text"
                  value={updateForm.todayTask}
                  onChange={(e) => setUpdateForm({ ...updateForm, todayTask: e.target.value })}
                  placeholder="What did you work on today?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Completed Today</label>
                <input
                  type="text"
                  value={updateForm.completedToday}
                  onChange={(e) => setUpdateForm({ ...updateForm, completedToday: e.target.value })}
                  placeholder="Completed milestones"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Any Blockers?</label>
                <input
                  type="text"
                  value={updateForm.blocker}
                  onChange={(e) => setUpdateForm({ ...updateForm, blocker: e.target.value })}
                  placeholder="Leave empty if none"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
              >
                {loading ? 'Submitting...' : 'Save Log'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { FolderKanban, Users, CheckSquare, AlertCircle, ArrowRight, X, Plus, Shield, UserPlus, Check } from 'lucide-react';
import { api } from '../services/api';
import { Project, Intern } from '../types';
import { useApp } from '../context/AppContext';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectInterns, setProjectInterns] = useState<Intern[]>([]);
  const [allInterns, setAllInterns] = useState<Intern[]>([]);
  const [teamLeads, setTeamLeads] = useState<string[]>([]);
  const [isAssigningIntern, setIsAssigningIntern] = useState(false);
  const [isEditingCoLeads, setIsEditingCoLeads] = useState(false);
  const [selectedCoLeads, setSelectedCoLeads] = useState<string[]>([]);

  const { setSelectedInternId, currentRole, currentUser, setIsQuickActionOpen, showToast, refreshSummary } = useApp();

  useEffect(() => {
    fetchProjects();
    api.getInterns().then((res) => setAllInterns(res.interns));
    api.getTeams().then((res) => {
      const leads = Array.from(new Set(res.teams.map((t: any) => t.leadName).filter(Boolean))) as string[];
      setTeamLeads(leads);
    });
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects();
      setProjects(res.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    setIsAssigningIntern(false);
    setIsEditingCoLeads(false);
    setSelectedCoLeads(project.coLeads ? project.coLeads.split(',').map((s) => s.trim()).filter(Boolean) : []);
    try {
      const res = await api.getProjectById(project.id);
      setProjectInterns(res.project.interns || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignInternToProject = async (internId: string) => {
    if (!selectedProject) return;
    try {
      const updatedIds = Array.from(new Set([...projectInterns.map((i) => i.id), internId]));
      await api.updateProject(selectedProject.id, { internIds: updatedIds });
      const res = await api.getProjectById(selectedProject.id);
      setProjectInterns(res.project.interns || []);
      await fetchProjects();
      await refreshSummary();
      showToast('Intern assigned to project!');
      setIsAssigningIntern(false);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleRemoveInternFromProject = async (internId: string) => {
    if (!selectedProject) return;
    try {
      const updatedIds = projectInterns.map((i) => i.id).filter((id) => id !== internId);
      await api.updateProject(selectedProject.id, { internIds: updatedIds });
      const res = await api.getProjectById(selectedProject.id);
      setProjectInterns(res.project.interns || []);
      await fetchProjects();
      await refreshSummary();
      showToast('Intern removed from project');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleSaveCoLeads = async () => {
    if (!selectedProject) return;
    try {
      await api.updateProject(selectedProject.id, { coLeads: selectedCoLeads.join(', ') });
      setSelectedProject((prev) => (prev ? { ...prev, coLeads: selectedCoLeads.join(', ') } : null));
      await fetchProjects();
      showToast('Co-Leads updated successfully!');
      setIsEditingCoLeads(false);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const toggleCoLead = (lead: string) => {
    setSelectedCoLeads((prev) =>
      prev.includes(lead) ? prev.filter((l) => l !== lead) : [...prev, lead]
    );
  };

  // Interns not currently in this project
  const unassignedInterns = allInterns.filter(
    (i) => !projectInterns.some((pi) => pi.id === i.id)
  );

  const displayedProjects = projects;

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Projects Grid...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Engineering Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of {displayedProjects.length} active project{displayedProjects.length === 1 ? '' : 's'} with multi-lead & squad collaboration.
          </p>
        </div>

        {(currentRole === 'ADMIN' || currentRole === 'TEAM_LEAD') && (
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedProjects.map((project) => {
          const totalInterns = project.interns?.length || 0;
          const blocked = project.interns?.filter((i) => i.status === 'Blocked').length || 0;
          const working = project.interns?.filter((i) => i.status === 'Working').length || 0;
          const coLeadsList = project.coLeads
            ? project.coLeads.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

          return (
            <div
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="bg-white border border-slate-200 hover:border-sky-300 p-5 rounded-2xl cursor-pointer transition-all shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{project.name}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <span className="text-sky-700 font-semibold">👑 {project.projectLead}</span>
                    </p>
                  </div>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                    {totalInterns} Interns
                  </span>
                </div>

                {/* Co-Leads Display */}
                {coLeadsList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-medium">Co-Leads:</span>
                    {coLeadsList.map((cl) => (
                      <span
                        key={cl}
                        className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded-md"
                      >
                        🤝 {cl}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                    <span className="block font-bold text-emerald-800">{working}</span>
                    <span className="text-emerald-700 text-[10px] font-medium">Working</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                    <span className="block font-bold text-rose-800">{blocked}</span>
                    <span className="text-rose-700 text-[10px] font-medium">Blocked</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <span className="block font-bold text-slate-800">{totalInterns - working - blocked}</span>
                    <span className="text-slate-600 text-[10px] font-medium">Idle/Review</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-sky-600 font-semibold pt-1">
                  <span>Manage Squad Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT DETAIL & SQUAD ROSTER DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white border-l border-slate-200 w-full max-w-lg h-full shadow-2xl flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Primary Lead: <span className="font-bold text-slate-900">{selectedProject.projectLead}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Co-Leads Section in Drawer */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    🤝 Co-Leads ({selectedCoLeads.length})
                  </span>
                  {(currentRole === 'ADMIN' || currentRole === 'TEAM_LEAD') && (
                    <button
                      onClick={() => setIsEditingCoLeads(!isEditingCoLeads)}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                    >
                      {isEditingCoLeads ? 'Cancel' : 'Edit Co-Leads'}
                    </button>
                  )}
                </div>

                {isEditingCoLeads ? (
                  <div className="mt-2 space-y-2 p-2.5 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500">Select team leads to collaborate on this project:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {teamLeads
                        .filter((lead) => lead !== selectedProject.projectLead)
                        .map((lead) => {
                          const isSelected = selectedCoLeads.includes(lead);
                          return (
                            <button
                              key={lead}
                              type="button"
                              onClick={() => toggleCoLead(lead)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-purple-600" />}
                              {lead}
                            </button>
                          );
                        })}
                    </div>
                    <button
                      onClick={handleSaveCoLeads}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 rounded-lg text-xs"
                    >
                      Save Co-Leads
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedCoLeads.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No co-leads assigned yet.</span>
                    ) : (
                      selectedCoLeads.map((cl) => (
                        <span
                          key={cl}
                          className="text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md"
                        >
                          {cl}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Body - Squad Interns */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assigned Interns ({projectInterns.length})
                </h4>
                {(currentRole === 'ADMIN' || currentRole === 'TEAM_LEAD') && (
                  <button
                    onClick={() => setIsAssigningIntern(!isAssigningIntern)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isAssigningIntern ? 'Close' : 'Assign Intern'}
                  </button>
                )}
              </div>

              {/* Assign Intern Picker Drawer */}
              {isAssigningIntern && (
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl space-y-2">
                  <p className="text-[11px] font-bold text-sky-900">Add Intern to Project:</p>
                  <div className="max-h-36 overflow-y-auto divide-y divide-sky-100 bg-white border border-sky-200 rounded-lg">
                    {unassignedInterns.length === 0 ? (
                      <div className="p-2.5 text-center text-[11px] text-slate-400">All interns are already in this project</div>
                    ) : (
                      unassignedInterns.map((intern) => (
                        <div
                          key={intern.id}
                          onClick={() => handleAssignInternToProject(intern.id)}
                          className="p-2 hover:bg-sky-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{intern.name}</span>
                            <span className="text-[10px] text-slate-500 block">{intern.module || 'General'}</span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                            + Add {intern.status === 'No Task' ? '(Idle)' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Roster List */}
              <div className="space-y-2">
                {projectInterns.length === 0 ? (
                  <div className="text-center p-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No interns assigned to this project yet. Use "Assign Intern" above.
                  </div>
                ) : (
                  projectInterns.map((intern) => (
                    <div
                      key={intern.id}
                      className="bg-slate-50 border border-slate-200 hover:border-sky-300 p-3 rounded-xl transition-colors flex items-center justify-between"
                    >
                      <div
                        onClick={() => {
                          setSelectedProject(null);
                          setSelectedInternId(intern.id);
                        }}
                        className="cursor-pointer flex-1"
                      >
                        <p className="font-semibold text-xs text-slate-900 hover:text-sky-600 transition-colors">
                          {intern.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{intern.email} • {intern.module || 'General'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            intern.status === 'Working'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : intern.status === 'Blocked'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {intern.status}
                        </span>

                        {(currentRole === 'ADMIN' || currentRole === 'TEAM_LEAD') && (
                          <button
                            title="Remove from project"
                            onClick={() => handleRemoveInternFromProject(intern.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

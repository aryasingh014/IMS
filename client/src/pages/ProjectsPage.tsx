import React, { useState, useEffect } from 'react';
import { FolderKanban, Users, CheckSquare, AlertCircle, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { Project, Intern } from '../types';
import { useApp } from '../context/AppContext';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectInterns, setProjectInterns] = useState<Intern[]>([]);
  const { setSelectedInternId, currentRole, currentUser } = useApp();

  useEffect(() => {
    fetchProjects();
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
    try {
      const res = await api.getProjectById(project.id);
      setProjectInterns(res.project.interns || []);
    } catch (err) {
      console.error(err);
    }
  };

  const displayedProjects = currentRole === 'TEAM_LEAD'
    ? projects.filter((p) => p.projectLead?.toLowerCase().includes('vikram') || p.projectLead === currentUser.name)
    : projects;

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Projects Grid...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Engineering Projects</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of {displayedProjects.length} active project{displayedProjects.length === 1 ? '' : 's'} assigned to your squad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedProjects.map((project) => {

          const totalInterns = project.interns?.length || 0;
          const blocked = project.interns?.filter((i) => i.status === 'Blocked').length || 0;
          const working = project.interns?.filter((i) => i.status === 'Working').length || 0;

          return (
            <div
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="bg-white border border-slate-200 hover:border-sky-300 p-5 rounded-2xl cursor-pointer transition-all shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{project.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Lead: {project.projectLead}</p>
                  </div>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    {totalInterns} Interns
                  </span>
                </div>

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
                  <span>View Project Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT DETAIL DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white border-l border-slate-200 w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedProject.name}</h3>
                <p className="text-xs text-slate-500">Lead: {selectedProject.projectLead}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Interns ({projectInterns.length})</h4>

              <div className="space-y-2">
                {projectInterns.map((intern) => (
                  <div
                    key={intern.id}
                    onClick={() => {
                      setSelectedProject(null);
                      setSelectedInternId(intern.id);
                    }}
                    className="bg-slate-50 border border-slate-200 hover:border-sky-300 p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{intern.name}</p>
                      <p className="text-[10px] text-slate-500">{intern.email}</p>
                    </div>
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

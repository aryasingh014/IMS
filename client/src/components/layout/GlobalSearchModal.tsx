import React, { useState, useEffect } from 'react';
import { Search, X, Users, FolderKanban, CheckSquare, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Intern, Project } from '../../types';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setSelectedInternId, setActiveTab } = useApp();
  const [query, setQuery] = useState('');
  const [internResults, setInternResults] = useState<Intern[]>([]);
  const [projectResults, setProjectResults] = useState<Project[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length > 1) {
      api.getInterns({ search: query }).then((res) => setInternResults(res.interns.slice(0, 5)));
      api.getProjects().then((res) =>
        setProjectResults(
          res.projects
            .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
        )
      );
    } else {
      setInternResults([]);
      setProjectResults([]);
    }
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search interns, projects, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm outline-none font-medium"
          />
          <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
          {internResults.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">Interns</h4>
              <div className="space-y-1">
                {internResults.map((intern) => (
                  <div
                    key={intern.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSelectedInternId(intern.id);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{intern.name}</p>
                      <p className="text-[10px] text-slate-500">{intern.project?.name} • {intern.status}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {projectResults.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">Projects</h4>
              <div className="space-y-1">
                {projectResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setActiveTab('projects');
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">Lead: {p.projectLead}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim().length > 1 && internResults.length === 0 && projectResults.length === 0 && (
            <div className="text-center py-8 text-slate-400">No matching records found</div>
          )}
        </div>
      </div>
    </div>
  );
};

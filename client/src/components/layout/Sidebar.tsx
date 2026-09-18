import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  CalendarCheck,
  TrendingUp,
  Award,
  UsersRound,
  FileSpreadsheet,
  MessageSquare,
  History,
  Sparkles,
  Shield,
  UserCheck,
  User,
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, summaryData, currentRole, currentUser } = useApp();

  const allNavigation = [
    { id: 'dashboard', label: currentRole === 'INTERN' ? 'My Overview' : 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEAM_LEAD', 'INTERN'] },
    { id: 'projects', label: 'Projects Overview', icon: FolderKanban, count: summaryData?.kpi?.projectsCount, roles: ['ADMIN', 'TEAM_LEAD'] },
    { id: 'interns', label: 'Intern Directory', icon: Users, count: summaryData?.kpi?.totalInterns, roles: ['ADMIN', 'TEAM_LEAD'] },
    { id: 'tasks', label: currentRole === 'INTERN' ? 'My Tasks & Kanban' : 'Daily Tasks & Kanban', icon: CheckSquare, roles: ['ADMIN', 'TEAM_LEAD', 'INTERN'] },
    { id: 'idle', label: 'No Task / Idle', icon: Clock, count: summaryData?.kpi?.idleInterns, badgeColor: 'bg-amber-100 text-amber-800 font-bold border border-amber-300', roles: ['ADMIN', 'TEAM_LEAD'] },
    { id: 'blockers', label: 'Active Blockers', icon: AlertCircle, count: summaryData?.kpi?.blockedInterns, badgeColor: 'bg-rose-100 text-rose-700 font-bold border border-rose-300', roles: ['ADMIN', 'TEAM_LEAD'] },
    { id: 'daily-updates', label: currentRole === 'INTERN' ? 'Submit Daily Update' : 'Daily Updates Log', icon: CalendarCheck, roles: ['ADMIN', 'TEAM_LEAD', 'INTERN'] },
    { id: 'weekly-review', label: currentRole === 'INTERN' ? 'My Performance Scores' : 'Weekly Matrix', icon: TrendingUp, roles: ['ADMIN', 'TEAM_LEAD', 'INTERN'] },
    { id: 'profile', label: 'My Profile', icon: User, roles: ['INTERN'] },
    { id: 'ft-evaluation', label: 'FTE Candidates', icon: Award, count: summaryData?.kpi?.ftPotentialCount, badgeColor: 'bg-purple-100 text-purple-700 font-bold border border-purple-300', roles: ['ADMIN'] },
    { id: 'teams', label: 'Teams & Leads', icon: UsersRound, roles: ['ADMIN', 'TEAM_LEAD'] },
    { id: 'google-sheets', label: 'Google Sheets Sync', icon: FileSpreadsheet, roles: ['ADMIN'] },
    { id: 'whatsapp', label: 'WhatsApp Queue', icon: MessageSquare, roles: ['ADMIN'] },
    { id: 'audit', label: 'System Audit Logs', icon: History, roles: ['ADMIN'] },
  ];


  const allowedNavigation = allNavigation.filter((item) => item.roles.includes(currentRole));

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-sky-100 text-sky-700 border-sky-200',
    TEAM_LEAD: 'bg-purple-100 text-purple-700 border-purple-200',
    INTERN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none shadow-sm z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 leading-tight">InternOps Workspace</h1>
            <p className="text-[11px] font-medium text-slate-500">Role: <span className="font-bold text-slate-700">{currentRole}</span></p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {allowedNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-sm border border-sky-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || (isActive ? 'bg-sky-200 text-sky-800' : 'bg-slate-100 text-slate-600')
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile summary */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full border border-slate-200 object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleColors[currentRole]}`}>
              {currentRole}
            </span>
            <span className="text-[10px] font-medium text-slate-500 truncate">{currentUser.title}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

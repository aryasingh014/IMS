import React, { useState } from 'react';
import { Search, Plus, Bell, RefreshCw, Shield, Users, UserCheck, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    setIsSearchOpen,
    setIsQuickActionOpen,
    refreshSummary,
    summaryData,
    currentRole,
    currentUser,
    setCurrentRole,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const unacknowledgedAlerts =
    summaryData?.alerts?.filter((a) => !a.isAcknowledged) || [];

  const rolesList: Array<{ role: UserRole; label: string; icon: React.ReactNode; color: string }> = [
    {
      role: 'ADMIN',
      label: 'Admin',
      icon: <Shield className="w-3.5 h-3.5 text-sky-600" />,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      role: 'TEAM_LEAD',
      label: 'Team Lead',
      icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      role: 'INTERN',
      label: 'Intern',
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const currentRoleBadge = rolesList.find((r) => r.role === currentRole) || rolesList[0];

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-xs z-10">
      {/* Search Input Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded-xl text-xs w-72 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search interns, projects, tasks...</span>
          <kbd className="ml-auto bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Action Controls & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Testing Phase Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs"
            title="Switch Testing Phase User Role"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role:</span>
            <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg border ${currentRoleBadge.color}`}>
              {currentRoleBadge.icon}
              {currentRoleBadge.label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 space-y-1"
              onMouseLeave={() => setIsRoleDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Role Mode</p>
                <p className="text-[11px] font-semibold text-slate-700 truncate">{currentUser.name}</p>
              </div>

              {rolesList.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    setCurrentRole(item.role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentRole === item.role
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  {currentRole === item.role && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Summary Data */}
        <button
          onClick={() => refreshSummary()}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications / Alerts Indicator */}
        <div className="relative">
          <button
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Quick Action Button - Hidden for INTERN role */}
        {currentRole !== 'INTERN' && (
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Actions</span>
          </button>
        )}
      </div>
    </header>
  );
};


import React, { useState } from 'react';

import {
  Users,
  CheckSquare,
  AlertCircle,
  Clock,
  TrendingUp,
  FolderKanban,
  Award,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import { api } from '../services/api';
import { BlockerReasonModal } from '../components/modals/BlockerReasonModal';

export const DashboardPage: React.FC = () => {
  const { summaryData, isLoadingSummary, setSelectedInternId, setActiveTab, currentRole, currentUser, showToast, refreshSummary } = useApp();
  const [isReportBlockerOpen, setIsReportBlockerOpen] = useState(false);

  const handleCreateBlockerFromDashboard = async (reason: string) => {
    try {
      await api.createBlocker({
        description: reason,
      });
      setIsReportBlockerOpen(false);
      refreshSummary();
      showToast('Blocker reported successfully to your Team Lead!');
    } catch (err) {
      console.error(err);
    }
  };



  if (isLoadingSummary || !summaryData) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          <span>Loading Dashboard Metrics...</span>
        </div>
      </div>
    );
  }

  const { kpi, projectSummary, statusBoard, charts, recentUpdates, alerts } = summaryData;

  const kpiCards = [
    {
      title: 'Total Interns',
      value: kpi.totalInterns,
      subtitle: 'Across 7 active projects',
      icon: Users,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-100',
      tab: 'interns',
    },
    {
      title: 'Active Working',
      value: kpi.activeInterns,
      subtitle: `${Math.round((kpi.activeInterns / kpi.totalInterns) * 100)}% active output`,
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      tab: 'tasks',
    },
    {
      title: 'Blocked Interns',
      value: kpi.blockedInterns,
      subtitle: 'Requires admin assistance',
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-100',
      badge: kpi.blockedInterns > 0 ? 'CRITICAL' : null,
      tab: 'blockers',
    },
    {
      title: 'No Task / Idle',
      value: kpi.idleInterns,
      subtitle: 'Available for ticket assignment',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
      badge: kpi.idleInterns > 0 ? 'ATTENTION' : null,
      tab: 'idle',
    },
    {
      title: 'FT Potential Candidates',
      value: kpi.ftPotentialCount,
      subtitle: 'Strong performance track record',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100',
      tab: 'ft-evaluation',
    },
    {
      title: 'Active Projects',
      value: kpi.projectsCount,
      subtitle: 'Engineering initiatives',
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
      tab: 'projects',
    },
    {
      title: 'Daily Updates Logged',
      value: recentUpdates.length,
      subtitle: 'Submitted today',
      icon: Calendar,
      color: 'text-teal-600',
      bg: 'bg-teal-50 border-teal-100',
      tab: 'daily-updates',
    },
    {
      title: 'Fast Learners Rate',
      value: `${Math.round((charts.taskStatusDistribution.find((d: any) => d.name === 'Completed')?.value || 45) * 1.5)}%`,
      subtitle: 'Ahead of target schedule',
      icon: TrendingUp,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-100',
      tab: 'weekly-review',
    },
  ];

  const PIE_COLORS = ['#f43f5e', '#10b981', '#a855f7', '#0284c7'];

  if (currentRole === 'INTERN') {
    return (
      <div className="space-y-6 pb-10">
        {/* Intern Personal Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-6 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Intern Self-Service Workspace
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-2">Welcome back, {currentUser.name}! 👋</h2>
              <p className="text-xs text-sky-100">Assigned Project: <span className="font-semibold text-white">GLC AI Lead Intelligence</span> • Module: Email Automation</p>
            </div>
            <div className="hidden sm:block text-right bg-white/10 p-3.5 rounded-xl border border-white/20">
              <p className="text-[10px] font-bold text-sky-200 uppercase">Current Performance Rating</p>
              <p className="text-xl font-bold text-white">4.8 / 5.0 ⭐</p>
              <span className="text-[10px] bg-emerald-400/30 text-emerald-100 px-2 py-0.5 rounded font-bold">Fast Learner</span>
            </div>
          </div>
        </div>

        {/* Active Task Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                ACTIVE TICKET: TSK-201
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Implement FastAPI Integration & Unit Tests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned by Lead: Vikram Malhotra • Priority: High</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              In Progress (85%)
            </span>
          </div>

          {/* Progress Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Task Progress</span>
              <span className="text-sky-600 font-bold">85% Completed</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('daily-updates')}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Daily Progress Update
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              View All Assigned Tickets
            </button>
          </div>
        </div>

        {/* Quick Report Blocker Section */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 max-w-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Need Help or Facing a Blocker?
            </div>
            <button
              onClick={() => setIsReportBlockerOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Report Blocker Now
            </button>
          </div>
          <p className="text-xs text-amber-800">
            If you are stuck on API credentials, environment configuration, or need guidance from your Team Lead, report a mandatory blocker explanation to notify your lead.
          </p>
        </div>

        {/* Mandatory Blocker Reason Modal */}
        <BlockerReasonModal
          isOpen={isReportBlockerOpen}
          onClose={() => setIsReportBlockerOpen(false)}
          onSubmit={handleCreateBlockerFromDashboard}
          taskTitle="TSK-201: Implement FastAPI Integration & Unit Tests"
        />
      </div>
    );
  }



  const filterByLeadSquad = (list?: any[]) => {
    if (!list) return [];
    if (currentRole !== 'TEAM_LEAD') return list;
    return list.filter((item: any) =>
      item.project?.name === 'GLC AI Lead Intelligence' ||
      item.project?.projectLead?.toLowerCase().includes('vikram') ||
      item.intern?.project?.name === 'GLC AI Lead Intelligence' ||
      item.name === 'Rahul Kumar' ||
      item.internName === 'Rahul Kumar'
    );
  };

  const scopedStatusBoard = {
    WORKING: filterByLeadSquad(statusBoard.WORKING),
    BLOCKED: filterByLeadSquad(statusBoard.BLOCKED),
    NO_TASK: filterByLeadSquad(statusBoard.NO_TASK),
    WAITING_REVIEW: filterByLeadSquad(statusBoard.WAITING_REVIEW),
    COMPLETED: filterByLeadSquad(statusBoard.COMPLETED),
  };

  const displayedProjectSummary = currentRole === 'TEAM_LEAD'
    ? projectSummary.filter((p) => p.name === 'GLC AI Lead Intelligence' || p.projectLead?.toLowerCase().includes('vikram'))
    : projectSummary;

  return (

    <div className="space-y-6 pb-10">

      {/* Overview Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentRole === 'TEAM_LEAD' ? 'Squad Operations Dashboard' : 'Executive Operations Dashboard'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'TEAM_LEAD'
              ? 'Real-time management overview for assigned project & squad members.'
              : 'Real-time management overview for 40 interns across 7 engineering projects.'}
          </p>
        </div>


        {/* Quick Alert Counter */}
        {alerts && alerts.filter((a) => !a.isAcknowledged).length > 0 && (
          <div
            onClick={() => setActiveTab('blockers')}
            className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors shadow-xs"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-bounce" />
            <span>{alerts.filter((a) => !a.isAcknowledged).length} Actionable Operational Alerts</span>
          </div>
        )}
      </div>

      {/* 8 KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(card.tab as any)}

              className={`bg-white border border-slate-200 hover:border-sky-300 p-4 rounded-2xl cursor-pointer transition-all shadow-xs hover:shadow-md flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</span>
                  {card.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        card.badge === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between font-medium">
                <span>{card.subtitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </p>
            </div>
          );
        })}
      </div>

      {/* VISUAL STATUS BOARD (KANBAN COLUMNS) */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Intern Live Status Board</h3>
            <p className="text-xs text-slate-500">
              Categorized real-time status distribution across all 40 interns.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('interns')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
          >
            View Full Directory →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Working */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">WORKING</span>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {scopedStatusBoard.WORKING?.length || 0}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scopedStatusBoard.WORKING?.slice(0, 5).map((i) => (
                <div
                  key={i.id}
                  onClick={() => setSelectedInternId(i.id)}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-slate-900 truncate">{i.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{i.project?.name}</p>
                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${i.tasks?.[0]?.progress || 50}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked */}
          <div className="bg-rose-50/50 border border-rose-200/80 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <span className="text-xs font-bold text-rose-800">BLOCKED</span>
              <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                {scopedStatusBoard.BLOCKED?.length || 0}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scopedStatusBoard.BLOCKED?.map((i) => (
                <div
                  key={i.id}
                  onClick={() => setSelectedInternId(i.id)}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-slate-900 truncate">{i.name}</p>
                  <p className="text-[10px] text-rose-600 font-medium truncate">{i.tasks?.[0]?.notes || 'Awaiting Unblock'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* No Task */}
          <div className="bg-amber-50/50 border border-amber-200/80 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <span className="text-xs font-bold text-amber-800">NO TASK / IDLE</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                {scopedStatusBoard.NO_TASK?.length || 0}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scopedStatusBoard.NO_TASK?.map((i) => (
                <div
                  key={i.id}
                  onClick={() => setSelectedInternId(i.id)}
                  className="bg-white p-2.5 rounded-lg border border-amber-200 hover:border-amber-300 text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-slate-900 truncate">{i.name}</p>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Needs Ticket
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Review */}
          <div className="bg-purple-50/50 border border-purple-200/80 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200">
              <span className="text-xs font-bold text-purple-800">REVIEW QUEUE</span>
              <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                {scopedStatusBoard.WAITING_REVIEW?.length || 0}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scopedStatusBoard.WAITING_REVIEW?.map((i) => (
                <div
                  key={i.id}
                  onClick={() => setSelectedInternId(i.id)}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-slate-900 truncate">{i.name}</p>
                  <p className="text-[10px] text-purple-600 font-medium truncate">{i.tasks?.[0]?.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Completed */}
          <div className="bg-sky-50/50 border border-sky-200/80 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-sky-200">
              <span className="text-xs font-bold text-sky-800">COMPLETED TODAY</span>
              <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                {scopedStatusBoard.COMPLETED?.length || 0}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scopedStatusBoard.COMPLETED?.map((i) => (
                <div
                  key={i.id}
                  onClick={() => setSelectedInternId(i.id)}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-sky-300 text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-slate-900 truncate">{i.name}</p>
                  <p className="text-[10px] text-emerald-600 font-bold truncate">✓ 100% Done</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT WORKLOAD & CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Workload Distribution (Bar Chart) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Workload & Active Capacity</h3>
              <p className="text-xs text-slate-500">Distribution of 40 interns across engineering projects.</p>
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.internsByProject}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="active" name="Active Working" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="blocked" name="Blocked" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Distribution (Pie Chart) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Overall Task Status</h3>
            <p className="text-xs text-slate-500">Breakdown of total task tickets.</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.taskStatusDistribution}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.taskStatusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-2 border-t border-slate-100">
            {charts.taskStatusDistribution.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROJECT SUMMARY GRID */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {displayedProjectSummary.length} Project{displayedProjectSummary.length === 1 ? '' : 's'} Workload Overview
            </h3>
            <p className="text-xs text-slate-500">Summary of leads, intern count, and average completion rate.</p>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
          >
            Manage Projects →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {displayedProjectSummary.map((p) => (

            <div
              key={p.id}
              onClick={() => setActiveTab('projects')}
              className="bg-slate-50/50 border border-slate-200 hover:border-sky-300 p-4 rounded-xl cursor-pointer transition-colors shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-500">Lead: {p.projectLead}</p>
                </div>
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                  {p.internCount} Interns
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-500">Avg Target Progress</span>
                  <span className="text-slate-900 font-bold">{p.avgProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full"
                    style={{ width: `${p.avgProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500">
                <span className="text-emerald-700 font-bold">{p.activeCount} Working</span>
                {p.blockedCount > 0 ? (
                  <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                    {p.blockedCount} Blocked
                  </span>
                ) : (
                  <span className="text-slate-400">0 Blocked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

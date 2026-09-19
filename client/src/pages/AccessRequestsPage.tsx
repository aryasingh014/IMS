import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Layers,
  Users,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { PendingUser } from '../types';
import { useApp } from '../context/AppContext';

export const AccessRequestsPage: React.FC = () => {
  const { showToast, refreshSummary } = useApp();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEAM_LEAD' | 'INTERN'>('ALL');

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPendingRegistrations();
      setPendingUsers(res.pendingUsers || []);
    } catch (err: any) {
      showToast(`Error fetching access requests: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string, name: string, role: string) => {
    try {
      setProcessingId(id);
      await api.approveRegistration(id);
      showToast(`Approved ID request for ${name} (${role})`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      await refreshSummary();
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to reject and delete the access request for ${name}?`)) {
      return;
    }
    try {
      setProcessingId(id);
      await api.rejectRegistration(id);
      showToast(`Rejected ID request for ${name}`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      await refreshSummary();
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = pendingUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.module && user.module.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const leadCount = pendingUsers.filter((u) => u.role === 'TEAM_LEAD').length;
  const internCount = pendingUsers.filter((u) => u.role === 'INTERN').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">ID Access & Registration Requests</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
              {pendingUsers.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and approve pending accounts created by prospective Team Leads and Interns.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pending</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingUsers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Lead Requests</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{leadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Intern ID Requests</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{internCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, tech stack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({pendingUsers.length})
            </button>
            <button
              onClick={() => setRoleFilter('TEAM_LEAD')}
              className={`px-3 py-1 rounded-lg transition-all ${
                roleFilter === 'TEAM_LEAD' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Team Leads ({leadCount})
            </button>
            <button
              onClick={() => setRoleFilter('INTERN')}
              className={`px-3 py-1 rounded-lg transition-all ${
                roleFilter === 'INTERN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Interns ({internCount})
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
            <p className="text-xs font-semibold">Loading access requests...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No Pending Access Requests</p>
            <p className="text-xs text-slate-500 mt-1">
              All user registration requests have been reviewed or no matches were found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Requested Role</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Module / Tech Stack</th>
                  <th className="py-3 px-4">Applied On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Applicant Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      {user.role === 'TEAM_LEAD' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                          <Users className="w-3 h-3" />
                          Team Lead
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                          <UserCheck className="w-3 h-3" />
                          Intern
                        </span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-slate-600">
                      {user.phone ? (
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {user.module || 'Full Stack Web'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(user.id, user.name, user.role)}
                          disabled={processingId === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(user.id, user.name)}
                          disabled={processingId === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import {
  DashboardSummary,
  Intern,
  Project,
  Task,
  DailyUpdate,
  Blocker,
  FTEvaluation,
  WhatsAppMessage,
  AlertItem,
  PendingUser,
} from '../types';

const API_BASE = '/api';

let authToken: string | null = localStorage.getItem('ims_auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('ims_auth_token', token);
  } else {
    localStorage.removeItem('ims_auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

// ponytail: concise verb helpers replacing repetitive fetchJSON wrappers
const get = <T>(path: string) => fetchJSON<T>(`${API_BASE}${path}`);
const post = <T>(path: string, body?: any) =>
  fetchJSON<T>(`${API_BASE}${path}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const put = <T>(path: string, body?: any) =>
  fetchJSON<T>(`${API_BASE}${path}`, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
const qs = (p?: Record<string, string>) => (p && Object.keys(p).length ? `?${new URLSearchParams(p)}` : '');

export const api = {
  login: (credentials: { email: string; password: string }) =>
    post<{ token: string; user: any }>('/auth/login', credentials),

  register: (data: { name: string; email: string; password: string; role: string; phone?: string; module?: string }) =>
    post<{ message: string; user: any }>('/auth/register', data),

  getPendingRegistrations: () => get<{ pendingUsers: PendingUser[] }>('/auth/registrations/pending'),
  approveRegistration: (id: string) => post<{ message: string; user: any }>(`/auth/registrations/${id}/approve`),
  rejectRegistration: (id: string) => post<{ message: string; user: any }>(`/auth/registrations/${id}/reject`),

  getDashboardSummary: () => get<DashboardSummary>('/dashboard/summary'),

  getInterns: (p?: Record<string, string>) => get<{ interns: Intern[] }>(`/interns${qs(p)}`),
  getIdleInterns: () => get<{ idleInterns: Intern[] }>('/interns/idle'),
  getInternById: (id: string) => get<{ intern: Intern; timeline: any[] }>(`/interns/${id}`),
  createIntern: (data: Partial<Intern>) => post<{ intern: Intern }>('/interns', data),
  updateIntern: (id: string, data: Partial<Intern>) => put<{ intern: Intern }>(`/interns/${id}`, data),

  getProjects: () => get<{ projects: Project[] }>('/projects'),
  getProjectById: (id: string) => get<{ project: Project }>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => post<{ project: Project }>('/projects', data),
  updateProject: (id: string, data: Partial<Project>) => put<{ project: Project }>(`/projects/${id}`, data),

  getTasks: (p?: Record<string, string>) => get<{ tasks: Task[] }>(`/tasks${qs(p)}`),
  createTask: (data: Partial<Task>) => post<{ task: Task }>('/tasks', data),
  updateTask: (id: string, data: Partial<Task>) => put<{ task: Task }>(`/tasks/${id}`, data),

  getDailyUpdates: (p?: Record<string, string>) => get<{ updates: DailyUpdate[] }>(`/updates${qs(p)}`),
  submitDailyUpdate: (data: Partial<DailyUpdate>) => post<{ update: DailyUpdate }>('/updates', data),

  getBlockers: (status?: string) => get<{ blockers: Blocker[] }>(`/blockers${status ? `?status=${status}` : ''}`),
  createBlocker: (data: Partial<Blocker>) => post<{ blocker: Blocker }>('/blockers', data),
  resolveBlocker: (id: string) => put<{ blocker: Blocker }>(`/blockers/${id}/resolve`),

  getPerformanceOverview: () => get<{ performance: any[] }>('/performance'),
  submitPerformanceReview: (data: any) => post<{ review: any; intern: Intern }>('/performance/review', data),

  getFTEvaluations: (level?: string) => get<{ evaluations: Intern[] }>(`/evaluations${level ? `?level=${level}` : ''}`),
  createFTEvaluation: (data: any) => post<{ evaluation: FTEvaluation }>('/evaluations', data),

  getTeams: () => get<{ teams: any[] }>('/teams'),

  getGoogleSheetConfig: () => get<{ config: any; mapping: any; logs: any[] }>('/google-sheets/config'),
  saveGoogleSheetConfig: (data: any) => post<{ config: any; mapping: any }>('/google-sheets/config', data),
  syncGoogleSheets: (data?: any) => post<{ success: boolean; result: any }>('/google-sheets/sync', data || {}),

  getPendingWhatsAppUpdates: () => get<{ pendingMessages: WhatsAppMessage[]; stats: any }>('/whatsapp/pending'),
  approveWhatsAppUpdate: (id: string) => post<{ success: boolean; intern: Intern }>(`/whatsapp/approve/${id}`),
  rejectWhatsAppUpdate: (id: string) => post<{ success: boolean }>(`/whatsapp/reject/${id}`),

  getAlerts: () => get<{ alerts: AlertItem[] }>('/alerts'),
  acknowledgeAlert: (id: string) => put<{ alert: AlertItem }>(`/alerts/${id}/acknowledge`),
  getAuditLogs: () => get<{ logs: any[] }>('/audit-logs'),

  resetDemoData: () => post<{ message: string }>('/demo-data/reset'),
};

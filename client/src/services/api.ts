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
} from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    fetchJSON<{ token: string; user: any }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Dashboard
  getDashboardSummary: () => fetchJSON<DashboardSummary>(`${API_BASE}/dashboard/summary`),

  // Interns
  getInterns: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON<{ interns: Intern[] }>(`${API_BASE}/interns${query ? `?${query}` : ''}`);
  },
  getIdleInterns: () => fetchJSON<{ idleInterns: Intern[] }>(`${API_BASE}/interns/idle`),
  getInternById: (id: string) =>
    fetchJSON<{ intern: Intern; timeline: any[] }>(`${API_BASE}/interns/${id}`),
  createIntern: (data: Partial<Intern>) =>
    fetchJSON<{ intern: Intern }>(`${API_BASE}/interns`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIntern: (id: string, data: Partial<Intern>) =>
    fetchJSON<{ intern: Intern }>(`${API_BASE}/interns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Projects
  getProjects: () => fetchJSON<{ projects: Project[] }>(`${API_BASE}/projects`),
  getProjectById: (id: string) => fetchJSON<{ project: Project }>(`${API_BASE}/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    fetchJSON<{ project: Project }>(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    fetchJSON<{ project: Project }>(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tasks
  getTasks: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON<{ tasks: Task[] }>(`${API_BASE}/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (data: Partial<Task>) =>
    fetchJSON<{ task: Task }>(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    fetchJSON<{ task: Task }>(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Daily Updates
  getDailyUpdates: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON<{ updates: DailyUpdate[] }>(`${API_BASE}/updates${query ? `?${query}` : ''}`);
  },
  submitDailyUpdate: (data: Partial<DailyUpdate>) =>
    fetchJSON<{ update: DailyUpdate }>(`${API_BASE}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Blockers
  getBlockers: (status?: string) =>
    fetchJSON<{ blockers: Blocker[] }>(`${API_BASE}/blockers${status ? `?status=${status}` : ''}`),
  createBlocker: (data: Partial<Blocker>) =>
    fetchJSON<{ blocker: Blocker }>(`${API_BASE}/blockers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resolveBlocker: (id: string) =>
    fetchJSON<{ blocker: Blocker }>(`${API_BASE}/blockers/${id}/resolve`, {
      method: 'PUT',
    }),

  // Performance
  getPerformanceOverview: () => fetchJSON<{ performance: any[] }>(`${API_BASE}/performance`),
  submitPerformanceReview: (data: any) =>
    fetchJSON<{ review: any; intern: Intern }>(`${API_BASE}/performance/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // FT Evaluation
  getFTEvaluations: (level?: string) =>
    fetchJSON<{ evaluations: Intern[] }>(`${API_BASE}/evaluations${level ? `?level=${level}` : ''}`),
  createFTEvaluation: (data: any) =>
    fetchJSON<{ evaluation: FTEvaluation }>(`${API_BASE}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Teams
  getTeams: () => fetchJSON<{ teams: any[] }>(`${API_BASE}/teams`),

  // Google Sheets
  getGoogleSheetConfig: () => fetchJSON<{ config: any; mapping: any; logs: any[] }>(`${API_BASE}/google-sheets/config`),
  saveGoogleSheetConfig: (data: any) =>
    fetchJSON<{ config: any; mapping: any }>(`${API_BASE}/google-sheets/config`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  syncGoogleSheets: (data?: any) =>
    fetchJSON<{ success: boolean; result: any }>(`${API_BASE}/google-sheets/sync`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  // WhatsApp
  getPendingWhatsAppUpdates: () => fetchJSON<{ pendingMessages: WhatsAppMessage[]; stats: any }>(`${API_BASE}/whatsapp/pending`),
  approveWhatsAppUpdate: (id: string) =>
    fetchJSON<{ success: boolean; intern: Intern }>(`${API_BASE}/whatsapp/approve/${id}`, {
      method: 'POST',
    }),
  rejectWhatsAppUpdate: (id: string) =>
    fetchJSON<{ success: boolean }>(`${API_BASE}/whatsapp/reject/${id}`, {
      method: 'POST',
    }),

  // Alerts & Audit
  getAlerts: () => fetchJSON<{ alerts: AlertItem[] }>(`${API_BASE}/alerts`),
  acknowledgeAlert: (id: string) =>
    fetchJSON<{ alert: AlertItem }>(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'PUT',
    }),
  getAuditLogs: () => fetchJSON<{ logs: any[] }>(`${API_BASE}/audit-logs`),

  // Demo Data Reset
  resetDemoData: () => fetchJSON<{ message: string }>(`${API_BASE}/demo-data/reset`, { method: 'POST' }),
};

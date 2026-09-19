import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';
import { DashboardSummary, UserRole } from '../types';

export interface RoleUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
  internId?: string | null;
  teamId?: string | null;
}

export const ROLE_CREDENTIALS: Record<UserRole, { email: string; password: string; title: string; defaultAvatar: string }> = {
  ADMIN: {
    email: 'admin@company.com',
    password: 'adminpassword123',
    title: 'System Administrator',
    defaultAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  TEAM_LEAD: {
    email: 'lead@company.com',
    password: 'leadpassword123',
    title: 'Engineering Team Lead',
    defaultAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  INTERN: {
    email: 'intern@company.com',
    password: 'internpassword123',
    title: 'Software Engineer Intern',
    defaultAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
};

export const MOCK_USERS: Record<UserRole, RoleUser> = {
  ADMIN: {
    name: 'Arya Singh',
    email: ROLE_CREDENTIALS.ADMIN.email,
    role: 'ADMIN',
    title: ROLE_CREDENTIALS.ADMIN.title,
    avatar: ROLE_CREDENTIALS.ADMIN.defaultAvatar,
  },
  TEAM_LEAD: {
    name: 'Team Lead',
    email: ROLE_CREDENTIALS.TEAM_LEAD.email,
    role: 'TEAM_LEAD',
    title: ROLE_CREDENTIALS.TEAM_LEAD.title,
    avatar: ROLE_CREDENTIALS.TEAM_LEAD.defaultAvatar,
  },
  INTERN: {
    name: 'Engineering Intern',
    email: ROLE_CREDENTIALS.INTERN.email,
    role: 'INTERN',
    title: ROLE_CREDENTIALS.INTERN.title,
    avatar: ROLE_CREDENTIALS.INTERN.defaultAvatar,
  },
};

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'interns'
  | 'tasks'
  | 'idle'
  | 'blockers'
  | 'daily-updates'
  | 'weekly-review'
  | 'ft-evaluation'
  | 'teams'
  | 'google-sheets'
  | 'whatsapp'
  | 'audit'
  | 'profile';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedInternId: string | null;
  setSelectedInternId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  isQuickActionOpen: boolean;
  setIsQuickActionOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  dashboardSummary: DashboardSummary | null;
  summaryData?: DashboardSummary | null;

  isLoadingSummary: boolean;
  refreshSummary: () => Promise<void>;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  currentRole: UserRole;
  currentUser: RoleUser;
  setCurrentRole: (role: UserRole) => Promise<void>;
  updateCurrentUser: (updates: Partial<RoleUser>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentRole, setCurrentRoleState] = useState<UserRole>('ADMIN');
  const [currentUser, setCurrentUser] = useState<RoleUser>(MOCK_USERS.ADMIN);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const refreshSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const data = await api.getDashboardSummary();
      setDashboardSummary(data);
    } catch (err: any) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const authenticateRole = async (role: UserRole) => {
    try {
      const creds = ROLE_CREDENTIALS[role];
      const res = await api.login({ email: creds.email, password: creds.password });
      setAuthToken(res.token);
      setCurrentRoleState(role);
      setCurrentUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        title: creds.title,
        avatar: res.user.avatar || creds.defaultAvatar,
        internId: res.user.internId,
        teamId: res.user.teamId,
      });
      await refreshSummary();
    } catch (error: any) {
      console.error(`Failed to authenticate as ${role}:`, error);
      showToast(`Auth error: ${error.message}`);
    }
  };

  // Authenticate on initial load
  useEffect(() => {
    authenticateRole('ADMIN');
  }, []);

  const setCurrentRole = async (role: UserRole) => {
    await authenticateRole(role);
    showToast(`Authenticated and switched active role to ${role}`);
  };

  const updateCurrentUser = (updates: Partial<RoleUser>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    showToast('Profile information updated successfully!');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedInternId,
        setSelectedInternId,
        selectedProjectId,
        setSelectedProjectId,
        isQuickActionOpen,
        setIsQuickActionOpen,
        isSearchOpen,
        setIsSearchOpen,
        dashboardSummary,
        summaryData: dashboardSummary,

        isLoadingSummary,
        refreshSummary,
        globalSearch,
        setGlobalSearch,
        toastMessage,
        showToast,

        currentRole,
        currentUser,
        setCurrentRole,
        updateCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

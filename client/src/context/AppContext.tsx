import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardSummary, UserRole } from '../types';

export interface RoleUser {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
}

export const MOCK_USERS: Record<UserRole, RoleUser> = {
  ADMIN: {
    name: 'Arya Singh',
    email: 'admin@company.com',
    role: 'ADMIN',
    title: 'System Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  TEAM_LEAD: {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@company.com',
    role: 'TEAM_LEAD',
    title: 'AI Core Lead',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  INTERN: {
    name: 'Rahul Kumar',
    email: 'rahul.kumar@company.com',
    role: 'INTERN',
    title: 'Software Engineer Intern',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
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
  setCurrentRole: (role: UserRole) => void;
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

  useEffect(() => {
    refreshSummary();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const [currentRole, setCurrentRoleState] = useState<UserRole>('ADMIN');
  const [currentUser, setCurrentUser] = useState<RoleUser>(MOCK_USERS.ADMIN);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    setCurrentUser(MOCK_USERS[role]);
    showToast(`Switched active test role to ${role}`);
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

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { QuickActionModal } from './components/layout/QuickActionModal';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { InternsPage } from './pages/InternsPage';
import { TasksPage } from './pages/TasksPage';
import { IdleInternsPage } from './pages/IdleInternsPage';
import { BlockersPage } from './pages/BlockersPage';
import { DailyUpdatesPage } from './pages/DailyUpdatesPage';
import { WeeklyReviewPage } from './pages/WeeklyReviewPage';
import { FTEvaluationPage } from './pages/FTEvaluationPage';
import { TeamsPage } from './pages/TeamsPage';
import { GoogleSheetsSyncPage } from './pages/GoogleSheetsSyncPage';
import { WhatsAppIntegrationPage } from './pages/WhatsAppIntegrationPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { InternProfilePage } from './pages/InternProfilePage';

const MainLayout: React.FC = () => {
  const { activeTab, toastMessage } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'interns':
        return <InternsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'idle':
        return <IdleInternsPage />;
      case 'blockers':
        return <BlockersPage />;
      case 'daily-updates':
        return <DailyUpdatesPage />;
      case 'weekly-review':
        return <WeeklyReviewPage />;
      case 'profile':
        return <InternProfilePage />;
      case 'ft-evaluation':
        return <FTEvaluationPage />;
      case 'teams':
        return <TeamsPage />;
      case 'google-sheets':
        return <GoogleSheetsSyncPage />;
      case 'whatsapp':
        return <WhatsAppIntegrationPage />;
      case 'audit':
        return <AuditLogsPage />;
      default:
        return <DashboardPage />;
    }
  };


  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
      <QuickActionModal />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-sky-300 text-sky-900 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;

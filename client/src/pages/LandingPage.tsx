import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Users,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  Layers,
  FolderKanban,
  TrendingUp,
  Clock,
  KeyRound,
  X,
  AlertCircle
} from 'lucide-react';
import { useApp, ROLE_CREDENTIALS } from '../context/AppContext';
import { api, setAuthToken } from '../services/api';
import { UserRole } from '../types';

export const LandingPage: React.FC<{ onEnterApp: () => void }> = ({ onEnterApp }) => {
  const { setCurrentRole, showToast, login } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'signin' | 'register'>('signin');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form State
  const [regRole, setRegRole] = useState<'TEAM_LEAD' | 'INTERN'>('INTERN');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regModule, setRegModule] = useState('Full Stack Web');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const openAuthModal = (tab: 'signin' | 'register', defaultRole?: 'TEAM_LEAD' | 'INTERN') => {
    setModalTab(tab);
    if (defaultRole) setRegRole(defaultRole);
    setLoginError(null);
    setRegError(null);
    setRegSuccess(null);
    setIsModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const user = await login(loginEmail, loginPassword);
      showToast(`Welcome back, ${user.name}! (${user.role})`);
      setIsModalOpen(false);
      onEnterApp();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify your credentials or approval status.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await setCurrentRole(role);
      setIsModalOpen(false);
      onEnterApp();
    } catch (err: any) {
      setLoginError(err.message || 'Demo login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setIsRegistering(true);

    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone,
        module: regModule,
      });

      setRegSuccess(res.message || 'Registration submitted! Your ID is awaiting Admin approval.');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegPhone('');
      showToast('Registration submitted for admin approval!');
    } catch (err: any) {
      setRegError(err.message || 'Failed to submit registration request.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">InternOps</span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
              Workspace v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal('signin')}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors border border-transparent hover:border-slate-700"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Create ID</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 self-center px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-medium mb-8 backdrop-blur-sm">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>Role-Based Secure Onboarding & Approvals</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Manage Engineering Interns & Teams with{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Precision & Control
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The all-in-one platform for Team Leads and Interns to collaborate on real projects, track daily updates, and manage seamless admin approvals.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => openAuthModal('register', 'TEAM_LEAD')}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-xl shadow-purple-600/25 transition-all hover:scale-105"
          >
            <Users className="w-4 h-4" />
            <span>Join as Team Lead</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => openAuthModal('register', 'INTERN')}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-bold bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-2xl shadow-xl shadow-sky-600/25 transition-all hover:scale-105"
          >
            <UserCheck className="w-4 h-4" />
            <span>Create Intern ID</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => openAuthModal('signin')}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-700 shadow-md transition-all hover:scale-105"
          >
            <Lock className="w-4 h-4 text-sky-400" />
            <span>Workspace Login</span>
          </button>
        </div>

        {/* Role Access Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Admin Card */}
          <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-base font-bold text-white">Administrator Portal</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Review and approve pending Team Lead & Intern ID registration requests. Manage overall projects, team assignments, and system audit logs.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
              <span>Full control & oversight</span>
            </div>
          </div>

          {/* Team Lead Card */}
          <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white">Team Lead Workspace</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Create projects, collaborate with co-leads, assign tasks to interns, clear blockers, and evaluate weekly performance scores.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
              <span>Multi-lead project governance</span>
            </div>
          </div>

          {/* Intern Card */}
          <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">Intern Portal</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Submit daily progress updates, view assigned tasks on Kanban boards, report blockers immediately, and track Full-Time evaluation metrics.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <span>Daily updates & task tracking</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 InternOps Workspace • Automated Intern & Team Lead Management System</p>
      </footer>

      {/* Modal for Sign In & Register */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setModalTab('signin');
                  setLoginError(null);
                  setRegError(null);
                  setRegSuccess(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  modalTab === 'signin'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('register');
                  setLoginError(null);
                  setRegError(null);
                  setRegSuccess(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  modalTab === 'register'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create ID / Request Access
              </button>
            </div>

            {/* TAB 1: SIGN IN */}
            {modalTab === 'signin' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Sign In to Your Account</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your approved credentials to access the workspace.
                  </p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/25 transition-all mt-2"
                  >
                    {isLoggingIn ? 'Verifying Account...' : 'Sign In'}
                  </button>
                </form>

                {/* Quick Demo Logins for Fast Access */}
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                    Quick Role Login (Pre-Approved)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('ADMIN')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group"
                    >
                      <Shield className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-200">Admin</p>
                      <p className="text-[10px] text-slate-500">Full Access</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('TEAM_LEAD')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group"
                    >
                      <Users className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-200">Team Lead</p>
                      <p className="text-[10px] text-slate-500">Projects & Tasks</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('INTERN')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-200">Intern</p>
                      <p className="text-[10px] text-slate-500">Updates & Scores</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CREATE ID / REQUEST ACCESS */}
            {modalTab === 'register' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">Create ID & Request Access</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill in your details. Your ID will be active as soon as Admin approves your request.
                  </p>
                </div>

                {regSuccess && (
                  <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Registration Request Submitted!</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {regSuccess}
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setModalTab('signin')}
                        className="text-xs font-bold text-emerald-400 hover:underline"
                      >
                        Return to Sign In →
                      </button>
                    </div>
                  </div>
                )}

                {regError && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {!regSuccess && (
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    {/* Role Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegRole('INTERN')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            regRole === 'INTERN'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Intern ID</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegRole('TEAM_LEAD')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            regRole === 'TEAM_LEAD'
                              ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Team Lead ID</span>
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="john@company.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Create Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / WhatsApp</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      {/* Module / Domain */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tech Stack / Module</label>
                        <select
                          value={regModule}
                          onChange={(e) => setRegModule(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        >
                          <option value="Full Stack Web">Full Stack Web (React / Node)</option>
                          <option value="Frontend Engineering">Frontend Engineering</option>
                          <option value="Backend Architecture">Backend Architecture</option>
                          <option value="AI / ML Systems">AI / ML Systems</option>
                          <option value="DevOps & Cloud">DevOps & Cloud</option>
                          <option value="Mobile App Dev">Mobile App Dev</option>
                          <option value="QA & Automation">QA & Automation</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/25 transition-all mt-2"
                    >
                      {isRegistering ? 'Submitting Registration...' : 'Submit ID Request to Admin'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

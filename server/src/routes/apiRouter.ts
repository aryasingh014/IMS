import { Router } from 'express';
import { getProfile, login } from '../controllers/authController.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { createIntern, getIdleInterns, getInternById, getInterns, updateIntern } from '../controllers/internController.js';
import { createProject, getProjectById, getProjects, updateProject } from '../controllers/projectController.js';
import { createTask, deleteTask, getTasks, updateTask } from '../controllers/taskController.js';
import { getDailyUpdates, submitDailyUpdate } from '../controllers/dailyUpdateController.js';
import { createBlocker, getBlockers, resolveBlocker } from '../controllers/blockerController.js';
import { getPerformanceOverview, submitPerformanceReview } from '../controllers/performanceController.js';
import { createFTEvaluation, getFTEvaluations } from '../controllers/ftEvaluationController.js';
import { createTeam, getTeams } from '../controllers/teamController.js';
import { getGoogleSheetConfig, saveGoogleSheetConfig, triggerGoogleSheetSync } from '../controllers/googleSheetsController.js';
import { approveUpdate, getPendingWhatsAppUpdates, receiveWebhook, rejectUpdate } from '../controllers/whatsappController.js';
import { acknowledgeAlert, getAlerts } from '../controllers/alertController.js';
import { getAuditLogs } from '../controllers/auditController.js';
import { resetDemoData } from '../controllers/demoDataController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();

// ==========================================
// 1. Public Endpoints
// ==========================================
router.post('/auth/login', login as any);
router.post('/whatsapp/webhook', receiveWebhook as any);

// ==========================================
// 2. Global Authentication for Protected APIs
// ==========================================
router.use(authenticate as any);

// User Profile
router.get('/auth/profile', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getProfile as any);

// Dashboard Summary (Scoped per role)
router.get('/dashboard/summary', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getDashboardSummary as any);

// Interns
router.get('/interns', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getInterns as any);
router.get('/interns/idle', requireRole('ADMIN', 'TEAM_LEAD') as any, getIdleInterns as any);
router.get('/interns/:id', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getInternById as any);
router.post('/interns', requireRole('ADMIN') as any, createIntern as any);
router.put('/interns/:id', requireRole('ADMIN', 'TEAM_LEAD') as any, updateIntern as any);

// Projects
router.get('/projects', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getProjects as any);
router.get('/projects/:id', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getProjectById as any);
router.post('/projects', requireRole('ADMIN') as any, createProject as any);
router.put('/projects/:id', requireRole('ADMIN') as any, updateProject as any);

// Tasks
router.get('/tasks', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getTasks as any);
router.post('/tasks', requireRole('ADMIN', 'TEAM_LEAD') as any, createTask as any);
router.put('/tasks/:id', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, updateTask as any);
router.delete('/tasks/:id', requireRole('ADMIN') as any, deleteTask as any);

// Daily Updates
router.get('/updates', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getDailyUpdates as any);
router.post('/updates', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, submitDailyUpdate as any);

// Blockers
router.get('/blockers', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getBlockers as any);
router.post('/blockers', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, createBlocker as any);
router.put('/blockers/:id/resolve', requireRole('ADMIN', 'TEAM_LEAD') as any, resolveBlocker as any);

// Performance Review & Matrix
router.get('/performance', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getPerformanceOverview as any);
router.post('/performance/review', requireRole('ADMIN', 'TEAM_LEAD') as any, submitPerformanceReview as any);

// Full-Time Evaluations
router.get('/evaluations', requireRole('ADMIN', 'TEAM_LEAD') as any, getFTEvaluations as any);
router.post('/evaluations', requireRole('ADMIN') as any, createFTEvaluation as any);

// Teams
router.get('/teams', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getTeams as any);
router.post('/teams', requireRole('ADMIN') as any, createTeam as any);

// Google Sheets Sync (ADMIN only)
router.get('/google-sheets/config', requireRole('ADMIN') as any, getGoogleSheetConfig as any);
router.post('/google-sheets/config', requireRole('ADMIN') as any, saveGoogleSheetConfig as any);
router.post('/google-sheets/sync', requireRole('ADMIN') as any, triggerGoogleSheetSync as any);

// WhatsApp Integration (ADMIN only)
router.get('/whatsapp/pending', requireRole('ADMIN') as any, getPendingWhatsAppUpdates as any);
router.post('/whatsapp/approve/:id', requireRole('ADMIN') as any, approveUpdate as any);
router.post('/whatsapp/reject/:id', requireRole('ADMIN') as any, rejectUpdate as any);

// System Alerts & Notifications
router.get('/alerts', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, getAlerts as any);
router.put('/alerts/:id/acknowledge', requireRole('ADMIN', 'TEAM_LEAD', 'INTERN') as any, acknowledgeAlert as any);

// Audit Logs (ADMIN only)
router.get('/audit-logs', requireRole('ADMIN') as any, getAuditLogs as any);

// Demo Data Reset (ADMIN only)
router.post('/demo-data/reset', requireRole('ADMIN') as any, resetDemoData as any);

export default router;

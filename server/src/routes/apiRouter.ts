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

const router = Router();

// Auth
router.post('/auth/login', login);
router.get('/auth/profile', getProfile);

// Dashboard Consolidated Summary
router.get('/dashboard/summary', getDashboardSummary);

// Interns
router.get('/interns', getInterns);
router.get('/interns/idle', getIdleInterns);
router.get('/interns/:id', getInternById);
router.post('/interns', createIntern);
router.put('/interns/:id', updateIntern);

// Projects
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Daily Updates
router.get('/updates', getDailyUpdates);
router.post('/updates', submitDailyUpdate);

// Blockers
router.get('/blockers', getBlockers);
router.post('/blockers', createBlocker);
router.put('/blockers/:id/resolve', resolveBlocker);

// Performance Review & Matrix
router.get('/performance', getPerformanceOverview);
router.post('/performance/review', submitPerformanceReview);

// FT Evaluation
router.get('/evaluations', getFTEvaluations);
router.post('/evaluations', createFTEvaluation);

// Teams
router.get('/teams', getTeams);
router.post('/teams', createTeam);

// Google Sheets Sync
router.get('/google-sheets/config', getGoogleSheetConfig);
router.post('/google-sheets/config', saveGoogleSheetConfig);
router.post('/google-sheets/sync', triggerGoogleSheetSync);

// WhatsApp Integration
router.get('/whatsapp/pending', getPendingWhatsAppUpdates);
router.post('/whatsapp/approve/:id', approveUpdate);
router.post('/whatsapp/reject/:id', rejectUpdate);
router.post('/whatsapp/webhook', receiveWebhook);

// System Alerts & Notifications
router.get('/alerts', getAlerts);
router.put('/alerts/:id/acknowledge', acknowledgeAlert);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// Demo Data Reset
router.post('/demo-data/reset', resetDemoData);

export default router;

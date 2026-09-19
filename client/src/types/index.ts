export interface Intern {
  id: string;
  internId: string;
  name: string;
  email: string;
  phone?: string;
  module?: string;
  status: 'Working' | 'Blocked' | 'No Task' | 'Waiting Review' | 'Completed';
  joiningDate: string;
  lastUpdated: string;
  remarks?: string;

  learningSpeed: number;
  technicalAbility: number;
  ownership: number;
  workQuality: number;
  consistency: number;
  communication: number;
  problemSolving: number;
  learningEvidence?: string;

  ftPotential: 'Strong Potential' | 'Potential' | 'Needs Observation' | 'Not Recommended';

  projectId?: string;
  project?: { id: string; name: string };

  teamId?: string;
  team?: { id: string; name: string; leadName: string };

  tasks?: Task[];
  dailyUpdates?: DailyUpdate[];
  blockers?: Blocker[];
  performanceReviews?: PerformanceReview[];
  ftEvaluations?: FTEvaluation[];
  whatsappMessages?: WhatsAppMessage[];
}

export interface Team {
  id: string;
  name: string;
  teamLeadId?: string;
  teamLead?: { id: string; name: string; email: string };
  interns?: Intern[];
}


export interface Project {
  id: string;
  name: string;
  projectLead: string;
  coLeads?: string;
  description?: string;
  status: string;
  targetCompletion: number;
  totalInterns?: number;
  activeCount?: number;
  blockedCount?: number;
  noTaskCount?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  avgProgress?: number;
  interns?: Intern[];
  tasks?: Task[];
  internIds?: string[];
}

export interface Task {
  id: string;
  taskId: string;
  description: string;
  module?: string;
  status: 'Not Started' | 'Working' | 'Blocked' | 'Waiting Review' | 'Completed' | 'Cancelled';
  progress: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  startDate: string;
  deadline?: string;
  completedDate?: string;
  reviewer?: string;
  assignedBy?: string;
  notes?: string;

  internId: string;
  intern?: { id: string; name: string; email: string; status: string };

  projectId: string;
  project?: { id: string; name: string; projectLead?: string };
}


export interface DailyUpdate {
  id: string;
  date: string;
  todayTask: string;
  completedToday?: string;
  pending?: string;
  blocker?: string;
  tomorrowTask?: string;
  notes?: string;
  internId: string;
  intern?: { name: string; email: string; project?: { name: string } };
}

export interface Blocker {
  id: string;
  description: string;
  reportedDate: string;
  daysBlocked: number;
  assignedTo?: string;
  status: 'Open' | 'Resolved';
  resolvedDate?: string;
  internId: string;
  intern?: { id: string; name: string; email: string; project?: { id: string; name: string } };
  taskId?: string;
  task?: { id: string; description: string; status: string };
}

export interface PerformanceReview {
  id: string;
  reviewDate: string;
  weekNumber: number;
  learningSpeed: number;
  technicalAbility: number;
  ownership: number;
  workQuality: number;
  consistency: number;
  communication: number;
  problemSolving: number;
  evidenceNotes?: string;
  reviewedBy?: string;
  internId: string;
}

export interface FTEvaluation {
  id: string;
  potentialLevel: string;
  evidence: string;
  evaluationNotes?: string;
  evaluatedBy: string;
  evaluationDate: string;
  internId: string;
  intern?: Intern;
}

export interface WhatsAppMessage {
  id: string;
  senderPhone: string;
  senderName?: string;
  rawMessage: string;
  extractedTask?: string;
  extractedStatus?: string;
  extractedProgress?: number;
  extractedBlocker?: string;
  confidence: number;
  parserType: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  receivedAt: string;
  internId?: string;
  intern?: Intern;
}

export interface AlertItem {
  id: string;
  type: 'IDLE' | 'BLOCKED' | 'OVERDUE' | 'NO_UPDATE';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  isAcknowledged: boolean;
  createdAt: string;
  intern?: { name: string };
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}


export interface DashboardSummary {
  kpi: {
    totalInterns: number;
    activeInterns: number;
    blockedInterns: number;
    idleInterns: number;
    completedTasksToday: number;
    projectsCount: number;
    ftPotentialCount: number;
    tasksDueToday: number;
  };
  projectSummary: Array<{
    id: string;
    name: string;
    projectLead: string;
    internCount: number;
    activeCount: number;
    blockedCount: number;
    completedTasks: number;
    avgProgress: number;
  }>;
  statusBoard: {
    WORKING: Intern[];
    BLOCKED: Intern[];
    NO_TASK: Intern[];
    WAITING_REVIEW: Intern[];
    COMPLETED: Intern[];
  };
  charts: {
    internsByProject: Array<{ name: string; fullName: string; count: number; active: number; blocked: number }>;
    taskStatusDistribution: Array<{ name: string; value: number }>;
    weeklyCompletion: Array<{ day: string; completed: number; assigned: number }>;
    blockersByProject: Array<{ name: string; blocked: number }>;
  };
  recentUpdates: DailyUpdate[];
  alerts: AlertItem[];
}

export type UserRole = 'ADMIN' | 'TEAM_LEAD' | 'INTERN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  internId?: string;
}


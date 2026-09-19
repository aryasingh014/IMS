import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/passwordUtils.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.alert.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.googleSheetConfig.deleteMany();
  await prisma.fTEvaluation.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.blocker.deleteMany();
  await prisma.dailyUpdate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.intern.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Arya Singh (Admin)',
      password: hashPassword('adminpassword123'),
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });
  console.log('✅ Created Admin user');

  // Create Teams
  const teamsData = [
    { name: 'AI Core & Automation', leadName: 'Vikram Malhotra', description: 'AI Models, Scrapers & Pipeline Engines' },
    { name: 'Frontend & UI Design', leadName: 'Priya Sharma', description: 'Design system, React apps, and mobile UI' },
    { name: 'Backend & Data Infra', leadName: 'Anish Verma', description: 'Database, Microservices & API Gateway' },
    { name: 'Enterprise Analytics', leadName: 'Neha Gupta', description: 'Reporting, BI dashboards & data engineering' },
  ];

  const teams = [];
  for (const t of teamsData) {
    const created = await prisma.team.create({ data: t });
    teams.push(created);

    // Create TEAM_LEAD User Account
    const leadEmail = t.leadName.toLowerCase().replace(' ', '.') + '@company.com';
    await prisma.user.create({
      data: {
        email: leadEmail,
        name: t.leadName,
        password: hashPassword('leadpassword123'),
        role: 'TEAM_LEAD',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
    });
  }
  console.log(`✅ Created ${teams.length} teams and Team Lead users`);


  // Create Projects
  const projectsData = [
    { name: 'GLC AI Lead Intelligence', projectLead: 'Vikram Malhotra', description: 'AI-driven lead scoring and automated website crawling', targetCompletion: 85 },
    { name: 'CII B2B Portal', projectLead: 'Anish Verma', description: 'B2B marketplace matching platform for corporate clients', targetCompletion: 80 },
    { name: 'Data Analytics Hub', projectLead: 'Neha Gupta', description: 'Internal business metrics dashboard & ETL pipeline', targetCompletion: 65 },
    { name: 'Email Automation Engine', projectLead: 'Priya Sharma', description: 'Drip campaign manager with OAuth integrations', targetCompletion: 90 },
    { name: 'WhatsApp Bot Service', projectLead: 'Vikram Malhotra', description: 'Automated intern and client update parser', targetCompletion: 75 },
    { name: 'Mobile Care App', projectLead: 'Priya Sharma', description: 'React Native Android/iOS companion application', targetCompletion: 50 },
    { name: 'Tender Discovery Engine', projectLead: 'Anish Verma', description: 'Multi-portal procurement tender aggregator', targetCompletion: 70 },
  ];

  const projects = [];
  for (const p of projectsData) {
    const created = await prisma.project.create({ data: p });
    projects.push(created);
  }
  console.log(`✅ Created ${projects.length} projects`);

  // 40 Intern Names & Profiles
  const internSeedList = [
    { name: 'Rahul Kumar', email: 'rahul.kumar@company.com', status: 'Working', module: 'Email Automation', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 5, workQuality: 4, consistency: 5, comms: 4, probSolve: 5, evidence: 'Completed FastAPI integration independently and resolved deployment issue in 1 day.' },
    { name: 'Priya Verma', email: 'priya.verma@company.com', status: 'Blocked', module: 'Salesforce OAuth', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 3, probSolve: 3, evidence: 'Good code quality, blocked on external API secrets approval.' },
    { name: 'Arun Patel', email: 'arun.patel@company.com', status: 'Working', module: 'Cron Scheduler', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 5, consistency: 5, comms: 5, probSolve: 4, evidence: 'Fixed critical memory leak in scheduler pipeline ahead of deadline.' },
    { name: 'Siddharth Rao', email: 'siddharth.rao@company.com', status: 'No Task', module: 'Lead Scoring API', ftPotential: 'Needs Observation', learningSpeed: 3, technicalAbility: 3, ownership: 2, workQuality: 3, consistency: 3, comms: 4, probSolve: 3, evidence: 'Finished previous task yesterday afternoon; currently waiting for new ticket assignment.' },
    { name: 'Ananya Roy', email: 'ananya.roy@company.com', status: 'Working', module: 'React Data Grid', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 4, workQuality: 5, consistency: 4, comms: 5, probSolve: 5, evidence: 'Rebuilt virtualized table component handling 50k rows smoothly.' },
    { name: 'Karan Shah', email: 'karan.shah@company.com', status: 'Blocked', module: 'MongoDB Scraping', ftPotential: 'Needs Observation', learningSpeed: 2, technicalAbility: 3, ownership: 3, workQuality: 3, consistency: 2, comms: 2, probSolve: 2, evidence: 'Stuck on proxy rotation error for 2 days without escalating.' },
    { name: 'Sneha Nair', email: 'sneha.nair@company.com', status: 'Completed', module: 'User Management UI', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 4, evidence: 'Completed design tokens and full RBAC layout matrix.' },
    { name: 'Rohan Joshi', email: 'rohan.joshi@company.com', status: 'Waiting Review', module: 'Auth Service', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 4, consistency: 5, comms: 4, probSolve: 4, evidence: 'Implemented JWT token refresh flow with unit tests.' },
    { name: 'Aditi Sharma', email: 'aditi.sharma@company.com', status: 'Working', module: 'Notification Engine', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 4, probSolve: 4, evidence: 'Building WebSocket push notifications gateway.' },
    { name: 'Manish Singh', email: 'manish.singh@company.com', status: 'No Task', module: 'CSV Export', ftPotential: 'Not Recommended', learningSpeed: 2, technicalAbility: 2, ownership: 1, workQuality: 2, consistency: 2, comms: 2, probSolve: 2, evidence: 'Missed 3 daily updates this week; requires close supervision.' },
    { name: 'Divya Agarwal', email: 'divya.agarwal@company.com', status: 'Working', module: 'Webhooks Ingestion', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 5, workQuality: 5, consistency: 5, comms: 4, probSolve: 5, evidence: 'Zero defect rate in production deployments.' },
    { name: 'Amit Saxena', email: 'amit.saxena@company.com', status: 'Blocked', module: 'PostgreSQL Migration', ftPotential: 'Needs Observation', learningSpeed: 3, technicalAbility: 3, ownership: 3, workQuality: 3, consistency: 3, comms: 3, probSolve: 3, evidence: 'Waiting for database index benchmark results.' },
    { name: 'Meera Pillai', email: 'meera.pillai@company.com', status: 'Working', module: 'Recharts Graphs', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 4, workQuality: 4, consistency: 4, comms: 5, probSolve: 4, evidence: 'Created responsive visual dashboard charts.' },
    { name: 'Tarun Mehta', email: 'tarun.mehta@company.com', status: 'Working', module: 'Tender Parsing', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 4, consistency: 5, comms: 4, probSolve: 5, evidence: 'Trained PDF extraction pipeline with high accuracy.' },
    { name: 'Nisha Gupta', email: 'nisha.gupta@company.com', status: 'Waiting Review', module: 'Form Validation', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 3, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 3, evidence: 'Implemented Zod schema validations across all admin modals.' },
    { name: 'Deepak Chawla', email: 'deepak.chawla@company.com', status: 'Working', module: 'Rate Limiter', ftPotential: 'Potential', learningSpeed: 3, technicalAbility: 4, ownership: 4, workQuality: 3, consistency: 4, comms: 3, probSolve: 4, evidence: 'Redis bucket implementation complete.' },
    { name: 'Pooja Bhatt', email: 'pooja.bhatt@company.com', status: 'Working', module: 'WhatsApp Parser', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 5, workQuality: 5, consistency: 4, comms: 5, probSolve: 5, evidence: 'Constructed rule-based parser engine seamlessly.' },
    { name: 'Varun Reddy', email: 'varun.reddy@company.com', status: 'Working', module: 'B2B Search Index', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 3, probSolve: 4, evidence: 'Optimized ElasticSearch query performance by 40%.' },
    { name: 'Ritu Kapoor', email: 'ritu.kapoor@company.com', status: 'Completed', module: 'Google Sheets SDK', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 5, consistency: 5, comms: 4, probSolve: 4, evidence: 'Built resilient retry & column mapping synchronizer.' },
    { name: 'Gaurav Kulkarni', email: 'gaurav.kulkarni@company.com', status: 'Working', module: 'Mobile Push Service', ftPotential: 'Needs Observation', learningSpeed: 3, technicalAbility: 3, ownership: 3, workQuality: 3, consistency: 3, comms: 3, probSolve: 3, evidence: 'Integrating FCM notifications.' },
    { name: 'Shweta Pandey', email: 'shweta.pandey@company.com', status: 'Working', module: 'Audit Logging', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 4, consistency: 5, comms: 5, probSolve: 4, evidence: 'Created entity change tracking interceptor.' },
    { name: 'Alok Mishra', email: 'alok.mishra@company.com', status: 'Working', module: 'Docker Pipeline', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 4, workQuality: 3, consistency: 4, comms: 3, probSolve: 4, evidence: 'Reduced docker build time by 50%.' },
    { name: 'Kavita Menon', email: 'kavita.menon@company.com', status: 'Waiting Review', module: 'Export PDF Report', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 3, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 3, evidence: 'HTML to PDF template generator works clean.' },
    { name: 'Nikhil Bose', email: 'nikhil.bose@company.com', status: 'Working', module: 'Client Portal UI', ftPotential: 'Needs Observation', learningSpeed: 3, technicalAbility: 3, ownership: 3, workQuality: 3, consistency: 3, comms: 3, probSolve: 2, evidence: 'Working on client login UI screens.' },
    { name: 'Tanvi Deshmukh', email: 'tanvi.deshmukh@company.com', status: 'Working', module: 'ETL Pipeline', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 4, workQuality: 5, consistency: 5, comms: 4, probSolve: 5, evidence: 'Built automated daily batch processor.' },
    { name: 'Yash Malhotra', email: 'yash.malhotra@company.com', status: 'Working', module: 'GraphQL Schema', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 3, probSolve: 4, evidence: 'Federated schema queries tested.' },
    { name: 'Simran Gill', email: 'simran.gill@company.com', status: 'Working', module: 'Dark Mode Tokens', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 3, ownership: 4, workQuality: 4, consistency: 4, comms: 5, probSolve: 3, evidence: 'Tailwind custom color tokens applied.' },
    { name: 'Harsh Vardhan', email: 'harsh.vardhan@company.com', status: 'Working', module: 'Tender Scraper', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 5, workQuality: 4, consistency: 5, comms: 4, probSolve: 5, evidence: 'Resilient browser scraping subagent engine.' },
    { name: 'Preeti Das', email: 'preeti.das@company.com', status: 'Working', module: 'Payment Gateway', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 4, evidence: 'Stripe webhook listener integrated.' },
    { name: 'Mayank Sen', email: 'mayank.sen@company.com', status: 'Working', module: 'Image Compression', ftPotential: 'Needs Observation', learningSpeed: 3, technicalAbility: 3, ownership: 2, workQuality: 3, consistency: 3, comms: 3, probSolve: 3, evidence: 'Resizing microservice setup.' },
    { name: 'Bhavna Tiwari', email: 'bhavna.tiwari@company.com', status: 'Completed', module: 'KPI Cards Layout', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 5, consistency: 5, comms: 5, probSolve: 4, evidence: 'Clean UI cards with dynamic percentage badges.' },
    { name: 'Chetan Shetty', email: 'chetan.shetty@company.com', status: 'Working', module: 'Redis Caching', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 3, probSolve: 4, evidence: 'Invalidation hooks configured.' },
    { name: 'Deepa Hegde', email: 'deepa.hegde@company.com', status: 'Working', module: 'Excel Import Logic', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 3, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 3, evidence: 'XLSX parser engine implemented.' },
    { name: 'Eshaan Nambiar', email: 'eshaan.nambiar@company.com', status: 'Working', module: 'S3 File Storage', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 4, ownership: 5, workQuality: 4, consistency: 5, comms: 4, probSolve: 5, evidence: 'Signed upload URL generation configured.' },
    { name: 'Farhan Ali', email: 'farhan.ali@company.com', status: 'Working', module: 'Search Filter Bar', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 3, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 3, evidence: 'Multi-select dropdown filters.' },
    { name: 'Geeta Krishna', email: 'geeta.krishna@company.com', status: 'Working', module: 'Slack Alert Bot', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 5, probSolve: 3, evidence: 'Webhook notification listener built.' },
    { name: 'Hemant Swamy', email: 'hemant.swamy@company.com', status: 'Working', module: 'Unit Test Coverage', ftPotential: 'Needs Observation', learningSpeed: 3, technicalAbility: 3, ownership: 3, workQuality: 3, consistency: 3, comms: 3, probSolve: 3, evidence: 'Writing Jest tests for controllers.' },
    { name: 'Isha Singhal', email: 'isha.singhal@company.com', status: 'Working', module: 'Role Based Access', ftPotential: 'Strong Potential', learningSpeed: 5, technicalAbility: 5, ownership: 5, workQuality: 5, consistency: 5, comms: 4, probSolve: 5, evidence: 'Granular middleware permission guard.' },
    { name: 'Jatin Bajaj', email: 'jatin.bajaj@company.com', status: 'Working', module: 'Activity Feed', ftPotential: 'Potential', learningSpeed: 4, technicalAbility: 3, ownership: 4, workQuality: 4, consistency: 4, comms: 4, probSolve: 3, evidence: 'Timeline feed display.' },
    { name: 'Komla Sen', email: 'komla.sen@company.com', status: 'Working', module: 'Password Reset Flow', ftPotential: 'Potential', learningSpeed: 3, technicalAbility: 4, ownership: 3, workQuality: 4, consistency: 4, comms: 3, probSolve: 3, evidence: 'Email token verification implemented.' },
  ];

  console.log('🌱 Inserting 40 interns and creating task history...');

  const interns = [];
  let taskCounter = 201;

  for (let i = 0; i < internSeedList.length; i++) {
    const data = internSeedList[i];
    const project = projects[i % projects.length];
    const team = teams[i % teams.length];

    const intern = await prisma.intern.create({
      data: {
        internId: `INT-10${(i + 1).toString().padStart(2, '0')}`,
        name: data.name,
        email: data.email,
        phone: `+91 98765 ${40000 + i}`,
        module: data.module,
        status: data.status,
        joiningDate: new Date(Date.now() - (30 - (i % 20)) * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - (i % 3) * 24 * 60 * 60 * 1000),
        learningSpeed: data.learningSpeed,
        technicalAbility: data.technicalAbility,
        ownership: data.ownership,
        workQuality: data.workQuality,
        consistency: data.consistency,
        communication: data.comms,
        problemSolving: data.probSolve,
        learningEvidence: data.evidence,
        ftPotential: data.ftPotential,
        projectId: project.id,
        teamId: team.id,
        remarks: `Intern is assigned to ${data.module} in project ${project.name}.`,
      },
    });
    interns.push(intern);

    // Create INTERN User Account
    await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashPassword('internpassword123'),
        role: 'INTERN',
        internId: intern.id,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + i}?w=150`,
      },
    });


    // Create primary active task
    let taskProgress = 0;
    if (data.status === 'Working') taskProgress = 40 + ((i * 7) % 50);
    else if (data.status === 'Completed') taskProgress = 100;
    else if (data.status === 'Waiting Review') taskProgress = 95;
    else if (data.status === 'Blocked') taskProgress = 30;
    else taskProgress = 0;

    const activeTask = await prisma.task.create({
      data: {
        taskId: `TSK-${taskCounter++}`,
        description: `Implement ${data.module} feature and write automated unit tests`,
        module: data.module,
        status: data.status === 'No Task' ? 'Completed' : (data.status === 'Working' ? 'Working' : data.status),
        progress: data.status === 'No Task' ? 100 : taskProgress,
        priority: i % 3 === 0 ? 'High' : (i % 4 === 0 ? 'Urgent' : 'Medium'),
        startDate: new Date(Date.now() - (7 - (i % 5)) * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + (3 + (i % 4)) * 24 * 60 * 60 * 1000),
        reviewer: team.leadName,
        notes: `Requires integration with ${project.name} main codebase.`,
        internId: intern.id,
        projectId: project.id,
      },
    });

    // Create a completed past task for timeline
    await prisma.task.create({
      data: {
        taskId: `TSK-${taskCounter++}`,
        description: `Initial setup and repository scaffolding for ${data.module}`,
        module: data.module,
        status: 'Completed',
        progress: 100,
        priority: 'Medium',
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        reviewer: team.leadName,
        notes: 'Successfully passed setup review.',
        internId: intern.id,
        projectId: project.id,
      },
    });

    // Create Daily Update
    await prisma.dailyUpdate.create({
      data: {
        date: new Date(Date.now() - (i % 2) * 24 * 60 * 60 * 1000),
        todayTask: `Working on ${data.module} implementation`,
        completedToday: `Finished unit tests for ${data.module} submodules`,
        pending: `Edge case validation for API response`,
        blocker: data.status === 'Blocked' ? `Blocked on API keys or external dependency` : null,
        tomorrowTask: `Finalize pull request for ${data.module}`,
        notes: `Update submitted via dashboard`,
        internId: intern.id,
      },
    });

    // Create Blocker if intern is blocked
    if (data.status === 'Blocked') {
      await prisma.blocker.create({
        data: {
          description: `Stuck on ${data.module} configuration. Requires credentials / senior dev guidance.`,
          reportedDate: new Date(Date.now() - (1 + (i % 3)) * 24 * 60 * 60 * 1000),
          daysBlocked: 1 + (i % 3),
          assignedTo: team.leadName,
          status: 'Open',
          internId: intern.id,
          taskId: activeTask.id,
        },
      });

      // Create Alert for blocked intern
      await prisma.alert.create({
        data: {
          type: 'BLOCKED',
          title: `Intern Blocked: ${intern.name}`,
          description: `${intern.name} has been blocked on ${data.module} for ${1 + (i % 3)} day(s).`,
          severity: (1 + (i % 3)) > 1 ? 'critical' : 'warning',
          internId: intern.id,
          projectId: project.id,
        },
      });
    }

    // Create Alert for Idle Intern
    if (data.status === 'No Task') {
      await prisma.alert.create({
        data: {
          type: 'IDLE',
          title: `No Active Task: ${intern.name}`,
          description: `${intern.name} completed previous task and currently has no active task assigned.`,
          severity: 'warning',
          internId: intern.id,
          projectId: project.id,
        },
      });
    }

    // Create Performance Review
    await prisma.performanceReview.create({
      data: {
        weekNumber: 3,
        reviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        learningSpeed: data.learningSpeed,
        technicalAbility: data.technicalAbility,
        ownership: data.ownership,
        workQuality: data.workQuality,
        consistency: data.consistency,
        communication: data.comms,
        problemSolving: data.probSolve,
        evidenceNotes: data.evidence,
        reviewedBy: team.leadName,
        internId: intern.id,
      },
    });

    // Create Full-Time Evaluation
    await prisma.fTEvaluation.create({
      data: {
        potentialLevel: data.ftPotential,
        evidence: data.evidence,
        evaluationNotes: `Evaluated during Week 3 review by ${team.leadName}.`,
        evaluatedBy: 'Admin',
        evaluationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        internId: intern.id,
      },
    });

    // Audit log entry for intern creation
    await prisma.auditLog.create({
      data: {
        entity: 'Intern',
        entityId: intern.id,
        action: 'CREATE',
        changedBy: 'System Seed',
        newValue: JSON.stringify({ name: intern.name, email: intern.email, project: project.name }),
        timestamp: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ Inserted 40 interns, tasks, updates, blockers, and evaluations`);

  // Google Sheets Config Seed
  await prisma.googleSheetConfig.create({
    data: {
      id: 'default',
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetName: 'Interns Master 2026',
      columnMapping: JSON.stringify({
        'Intern Name': 'intern_name',
        'Email': 'email',
        'Phone': 'phone',
        'Project': 'project',
        'Module': 'module',
        'Today\'s Task': 'task',
        'Status': 'status',
        'Progress %': 'progress',
        'Blocker': 'blocker',
      }),
      autoSync: false,
      lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  // Sync log seed
  await prisma.syncLog.create({
    data: {
      source: 'Google Sheets',
      status: 'Success',
      importedCount: 40,
      updatedCount: 12,
      skippedCount: 0,
      errorLog: 'No errors during initial synchronization.',
    },
  });

  // WhatsApp Messages Seed Queue
  const whatsappSeed = [
    { senderPhone: '+919876540000', senderName: 'Rahul Kumar', rawMessage: 'Rahul - completed email validation - 80%', extractedTask: 'Email validation', extractedStatus: 'Working', extractedProgress: 80, confidence: 0.95 },
    { senderPhone: '+919876540001', senderName: 'Priya Verma', rawMessage: 'Priya - blocked on Salesforce OAuth', extractedTask: 'Salesforce OAuth', extractedStatus: 'Blocked', extractedBlocker: 'Salesforce OAuth API credentials', confidence: 0.92 },
    { senderPhone: '+919876540002', senderName: 'Arun Patel', rawMessage: 'Arun - working on scheduler - 90%', extractedTask: 'Scheduler pipeline', extractedStatus: 'Working', extractedProgress: 90, confidence: 0.98 },
  ];

  for (let idx = 0; idx < whatsappSeed.length; idx++) {
    const item = whatsappSeed[idx];
    await prisma.whatsAppMessage.create({
      data: {
        senderPhone: item.senderPhone,
        senderName: item.senderName,
        rawMessage: item.rawMessage,
        extractedTask: item.extractedTask,
        extractedStatus: item.extractedStatus,
        extractedProgress: item.extractedProgress,
        extractedBlocker: item.extractedBlocker,
        confidence: item.confidence,
        parserType: 'RuleBasedParser',
        approvalStatus: 'Pending',
        internId: interns[idx].id,
      },
    });
  }

  console.log('✅ Created initial WhatsApp pending message queue');
  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

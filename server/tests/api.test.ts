// Comprehensive Automated Test Suite for RBAC, Scoping, and Audit Fixes
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Comprehensive RBAC & Audit Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // 1. Unauthenticated access check (401)
    console.log('1️⃣ Testing Unauthenticated Protection:');
    const unauthRes = await fetch(`${API_URL}/dashboard/summary`);
    assert(unauthRes.status === 401, 'GET /dashboard/summary without token returns 401');

    const unauthInterns = await fetch(`${API_URL}/interns`);
    assert(unauthInterns.status === 401, 'GET /interns without token returns 401');

    // 2. Authentication / Login for all 3 roles
    console.log('\n2️⃣ Testing Authentication (JWT Generation & Password Hashing):');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@company.com', password: 'adminpassword123' }),
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && !!adminAuth.token, 'Admin login succeeds with valid JWT token');

    const leadLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram.malhotra@company.com', password: 'leadpassword123' }),
    });
    const leadAuth = await leadLoginRes.json();
    assert(leadLoginRes.status === 200 && leadAuth.user.role === 'TEAM_LEAD', 'Team Lead login succeeds with TEAM_LEAD role payload');

    const internLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@company.com', password: 'internpassword123' }),
    });
    const internAuth = await internLoginRes.json();
    assert(internLoginRes.status === 200 && internAuth.user.role === 'INTERN', 'Intern login succeeds with INTERN role payload');

    // 3. Role Guard Tests (403 Forbidden enforcement)
    console.log('\n3️⃣ Testing Role Guards (403 Forbidden):');
    
    // Intern forbidden routes
    const internIdleRes = await fetch(`${API_URL}/interns/idle`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    assert(internIdleRes.status === 403, 'INTERN access to /interns/idle is 403 Forbidden');

    const internEvalRes = await fetch(`${API_URL}/evaluations`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    assert(internEvalRes.status === 403, 'INTERN access to /evaluations is 403 Forbidden');

    const internAuditRes = await fetch(`${API_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    assert(internAuditRes.status === 403, 'INTERN access to /audit-logs is 403 Forbidden');

    const internWhatsAppRes = await fetch(`${API_URL}/whatsapp/pending`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    assert(internWhatsAppRes.status === 403, 'INTERN access to /whatsapp/pending is 403 Forbidden');

    const internCreateProjRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${internAuth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Project', projectLead: 'Nobody' }),
    });
    assert(internCreateProjRes.status === 403, 'INTERN creating project is 403 Forbidden');

    // Team lead forbidden routes
    const leadAuditRes = await fetch(`${API_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${leadAuth.token}` },
    });
    assert(leadAuditRes.status === 403, 'TEAM_LEAD access to /audit-logs is 403 Forbidden');

    const leadSheetsRes = await fetch(`${API_URL}/google-sheets/config`, {
      headers: { Authorization: `Bearer ${leadAuth.token}` },
    });
    assert(leadSheetsRes.status === 403, 'TEAM_LEAD access to /google-sheets/config is 403 Forbidden');

    // 4. Critical Bug Fix Verification: Search Filter Role Scoping
    console.log('\n4️⃣ Testing Search Filter Role Isolation (Critical Bug #1 & #2 Fix):');
    
    // Intern searching for another person's name (must NOT return it)
    const internSearchOtherRes = await fetch(`${API_URL}/interns?search=Priya`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    const internSearchOtherData = await internSearchOtherRes.json();
    assert(
      internSearchOtherData.interns.length === 0,
      'INTERN search for another intern (Priya) returns 0 results (scoping preserved)'
    );

    // Intern searching for their own name
    const internSearchSelfRes = await fetch(`${API_URL}/interns?search=Rahul`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    const internSearchSelfData = await internSearchSelfRes.json();
    assert(
      internSearchSelfData.interns.length === 1 && internSearchSelfData.interns[0].email === 'rahul.kumar@company.com',
      'INTERN search for own name returns 1 result'
    );

    // Intern searching for tasks belonging to others
    const internTaskSearchRes = await fetch(`${API_URL}/tasks?search=Salesforce`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    const internTaskSearchData = await internTaskSearchRes.json();
    assert(
      internTaskSearchData.tasks.length === 0,
      'INTERN search for tasks not assigned to them returns 0 results'
    );

    // 5. Critical Bug Fix Verification: WhatsApp Webhook Token Validation
    console.log('\n5️⃣ Testing WhatsApp Webhook Token Validation (Critical Bug #4 Fix):');
    
    const webhookNoTokenRes = await fetch(`${API_URL}/whatsapp/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderPhone: '+919999999999', rawMessage: 'Test message' }),
    });
    assert(webhookNoTokenRes.status === 403, 'WhatsApp webhook without token returns 403 Forbidden');

    const webhookWrongTokenRes = await fetch(`${API_URL}/whatsapp/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-verify-token': 'wrong-token' },
      body: JSON.stringify({ senderPhone: '+919999999999', rawMessage: 'Test message' }),
    });
    assert(webhookWrongTokenRes.status === 403, 'WhatsApp webhook with invalid token returns 403 Forbidden');

    const webhookValidTokenRes = await fetch(`${API_URL}/whatsapp/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-verify-token': 'intern_mgmt_whatsapp_secret' },
      body: JSON.stringify({ senderPhone: '+919876540000', rawMessage: 'Rahul - completed feature - 100%' }),
    });
    assert(webhookValidTokenRes.status === 201, 'WhatsApp webhook with valid token returns 201 Created');

    // 6. Dynamic Dashboard Calculations
    console.log('\n6️⃣ Testing Dynamic Dashboard Calculations:');
    const dashboardRes = await fetch(`${API_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    const dashboardData = await dashboardRes.json();
    assert(
      Array.isArray(dashboardData.charts.weeklyCompletion) && dashboardData.charts.weeklyCompletion.length === 5,
      'Dashboard returns dynamic 5-day weekly completion chart dataset'
    );

    // 7. Sensitive Data Query Isolation in getInternById
    console.log('\n7️⃣ Testing Query-Level Isolation in getInternById:');
    const ownProfileRes = await fetch(`${API_URL}/interns/${internAuth.user.internId}`, {
      headers: { Authorization: `Bearer ${internAuth.token}` },
    });
    const ownProfileData = await ownProfileRes.json();
    assert(
      ownProfileData.intern.ftEvaluations === undefined && ownProfileData.intern.performanceReviews === undefined,
      'Sensitive HR evaluation & performance review records excluded from INTERN profile query response'
    );

    console.log(`\n🏁 Test Suite Finished: ${passed} Passed, ${failed} Failed\n`);
    if (failed > 0) process.exit(1);
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();

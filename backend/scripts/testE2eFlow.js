const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING E2E SYSTEM TESTS ---');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      testsFailed++;
    }
  }

  try {
    // 1. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@insurance.com', password: 'Admin@123456' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.token, 'Admin login succeeds and returns token');
    const adminToken = adminLoginData.token;

    // 2. Direct Customer Registration (Instant Activation, No Admin Approval)
    const testEmail = `cust_${Date.now()}@test.com`;
    const regCustRes = await fetch(`${BASE_URL}/auth/register-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: testEmail,
        mobile_no: '9876543210',
        password: 'Password@123',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      })
    });
    const regCustData = await regCustRes.json();
    assert(regCustRes.status === 201 && regCustData.user?.status === 'APPROVED', 'Customer registration is immediate and status is APPROVED');
    const customerToken = regCustData.token;

    // 3. Customer Authorization Check: Customer cannot access Admin endpoints
    const custOnAdminRes = await fetch(`${BASE_URL}/users/pending`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(custOnAdminRes.status === 403, 'Customer accessing Admin endpoint receives 403 Forbidden');

    // 4. Agent Registration requires Admin Approval
    const testAgentEmail = `agent_${Date.now()}@test.com`;
    const regAgentRes = await fetch(`${BASE_URL}/auth/register-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: 'Pending Agent',
        email: testAgentEmail,
        mobile_no: '9988776655',
        license_no: `LIC_${Date.now().toString().slice(-6)}`,
        password: 'Password@123'
      })
    });
    const regAgentData = await regAgentRes.json();
    assert(regAgentRes.status === 201 && regAgentData.user?.status === 'PENDING', 'Agent registers with status PENDING');

    // 5. Pending Agent cannot log in
    const pendingLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAgentEmail, password: 'Password@123' })
    });
    const pendingLoginData = await pendingLoginRes.json();
    assert(pendingLoginRes.status === 403 && pendingLoginData.error?.includes('pending'), 'Pending agent login returns 403 approval pending');

    // 6. Admin approves Agent
    const pendingListRes = await fetch(`${BASE_URL}/users/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingListData = await pendingListRes.json();
    assert(pendingListRes.status === 200 && Array.isArray(pendingListData), 'Admin can view pending agents');

    const pendingAgentUser = pendingListData.find(a => a.email === testAgentEmail);
    assert(!!pendingAgentUser, 'Admin sees newly registered pending agent');

    if (pendingAgentUser) {
      const approveRes = await fetch(`${BASE_URL}/users/${pendingAgentUser.user_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert(approveRes.status === 200, 'Admin approves agent account');

      // 7. Approved Agent can now log in
      const agentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testAgentEmail, password: 'Password@123' })
      });
      const agentLoginData = await agentLoginRes.json();
      assert(agentLoginRes.status === 200 && !!agentLoginData.token, 'Approved agent can log in successfully');
    }

    // 8. Dashboard real stats check
    const adminDashRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminDashData = await adminDashRes.json();
    assert(adminDashRes.status === 200 && adminDashData.stats?.totalCustomers !== undefined, 'Admin dashboard stats returns real DB statistics');

    // 9. Customer Dashboard stats check
    const custDashRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const custDashData = await custDashRes.json();
    assert(custDashRes.status === 200 && custDashData.role === 'CUSTOMER', 'Customer dashboard stats returns customer-specific data');

    // 10. Data Ownership Check: Customer accessing another customer's ID fails
    const custProfileRes = await fetch(`${BASE_URL}/customers/999999`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(custProfileRes.status === 403 || custProfileRes.status === 404, 'Customer cannot access unauthorized customer profile');

    // 11. Surveyor Registration and Approval
    const testSurveyorEmail = `surveyor_${Date.now()}@test.com`;
    const regSurveyorRes = await fetch(`${BASE_URL}/auth/register-surveyor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surveyor_name: 'Pending Surveyor',
        email: testSurveyorEmail,
        phone: '9811223344',
        license_no: `SRV_${Date.now().toString().slice(-6)}`,
        experience: 5,
        password: 'Password@123'
      })
    });
    const regSurveyorData = await regSurveyorRes.json();
    assert(regSurveyorRes.status === 201 && regSurveyorData.user?.status === 'PENDING', 'Surveyor registers with status PENDING');

    // Admin approves Surveyor
    const pendingListRes2 = await fetch(`${BASE_URL}/users/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingListData2 = await pendingListRes2.json();
    const pendingSurveyorUser = pendingListData2.find(s => s.email === testSurveyorEmail);
    assert(!!pendingSurveyorUser, 'Admin sees pending surveyor application');

    if (pendingSurveyorUser) {
      const approveSrvRes = await fetch(`${BASE_URL}/users/${pendingSurveyorUser.user_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert(approveSrvRes.status === 200, 'Admin approves surveyor account');

      const srvLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testSurveyorEmail, password: 'Password@123' })
      });
      const srvLoginData = await srvLoginRes.json();
      assert(srvLoginRes.status === 200 && !!srvLoginData.token, 'Approved surveyor can log in successfully');
    }

    // 12. Policy Types Fetch
    const policyTypesRes = await fetch(`${BASE_URL}/policy-types`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const policyTypes = await policyTypesRes.json();
    assert(policyTypesRes.status === 200 && Array.isArray(policyTypes), 'Policy types list accessible');

    // 13. Policies Fetch
    const policiesRes = await fetch(`${BASE_URL}/policies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const policies = await policiesRes.json();
    assert(policiesRes.status === 200 && Array.isArray(policies), 'Policies list accessible');

    // 14. Branches Fetch
    const branchesRes = await fetch(`${BASE_URL}/branches`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const branches = await branchesRes.json();
    assert(branchesRes.status === 200 && Array.isArray(branches), 'Branches list accessible');

    console.log(`\n========================================`);
    console.log(`SUMMARY: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Unexpected error in test runner:', err.message);
  }
}

runTests();

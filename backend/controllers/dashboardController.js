const pool = require("../db");

// GET DASHBOARD STATS
const getDashboardStats = async (req, res) => {
    try {
        const user = req.user;

        if (user.role === "CUSTOMER" && user.customer_id) {
            // Customer-specific dashboard
            const [custInfo, policies, claims, payments, nominees, documents] = await Promise.all([
                pool.query("SELECT * FROM customer WHERE customer_id = $1", [user.customer_id]),
                pool.query(`
                    SELECT p.*, pt.policy_name, pt.category, a.agent_name
                    FROM policy p
                    LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
                    LEFT JOIN agent a ON p.agent_id = a.agent_id
                    WHERE p.customer_id = $1
                    ORDER BY p.policy_id DESC
                `, [user.customer_id]),
                pool.query(`
                    SELECT c.*, p.policy_no
                    FROM claim c
                    JOIN policy p ON c.policy_id = p.policy_id
                    WHERE p.customer_id = $1
                    ORDER BY c.claim_date DESC
                `, [user.customer_id]),
                pool.query(`
                    SELECT py.*, p.policy_no
                    FROM premium_payment py
                    JOIN policy p ON py.policy_id = p.policy_id
                    WHERE p.customer_id = $1
                    ORDER BY py.payment_date DESC
                `, [user.customer_id]),
                pool.query(`
                    SELECT n.*, p.policy_no
                    FROM nominee n
                    JOIN policy p ON n.policy_id = p.policy_id
                    WHERE p.customer_id = $1
                `, [user.customer_id]),
                pool.query("SELECT * FROM document WHERE customer_id = $1", [user.customer_id])
            ]);

            const totalPolicies = policies.rows.length;
            const activePolicies = policies.rows.filter(p => (p.policy_status || "").toLowerCase() === "active").length;
            const totalClaims = claims.rows.length;
            const pendingClaims = claims.rows.filter(c => ["pending", "under review"].includes((c.claim_status || "").toLowerCase())).length;
            const totalPayments = payments.rows.length;
            const totalPremiumPaid = payments.rows
                .filter(py => ["successful", "paid", "completed"].includes((py.payment_status || "").toLowerCase()))
                .reduce((acc, py) => acc + parseFloat(py.amount || 0), 0);

            return res.json({
                role: "CUSTOMER",
                customer: custInfo.rows[0] || null,
                stats: {
                    totalPolicies,
                    activePolicies,
                    totalClaims,
                    pendingClaims,
                    totalPayments,
                    totalPremiumPaid,
                    totalNominees: nominees.rows.length,
                    totalDocuments: documents.rows.length
                },
                recentPolicies: policies.rows.slice(0, 5),
                recentClaims: claims.rows.slice(0, 5),
                recentPayments: payments.rows.slice(0, 5),
                documents: documents.rows
            });
        }

        if (user.role === "AGENT" && user.agent_id) {
            // Agent-specific dashboard
            const [policies, claims, payments, agentInfo] = await Promise.all([
                pool.query(`
                    SELECT p.*, pt.policy_name, pt.category, c.first_name || ' ' || c.last_name AS customer_name, c.email as customer_email, c.mobile_no as customer_mobile
                    FROM policy p
                    LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
                    LEFT JOIN customer c ON p.customer_id = c.customer_id
                    WHERE p.agent_id = $1
                    ORDER BY p.policy_id DESC
                `, [user.agent_id]),
                pool.query(`
                    SELECT cl.*, p.policy_no, c.first_name || ' ' || c.last_name AS customer_name
                    FROM claim cl
                    JOIN policy p ON cl.policy_id = p.policy_id
                    JOIN customer c ON p.customer_id = c.customer_id
                    WHERE p.agent_id = $1
                    ORDER BY cl.claim_date DESC
                `, [user.agent_id]),
                pool.query(`
                    SELECT py.*, p.policy_no
                    FROM premium_payment py
                    JOIN policy p ON py.policy_id = p.policy_id
                    WHERE p.agent_id = $1
                    ORDER BY py.payment_date DESC
                `, [user.agent_id]),
                pool.query(`
                    SELECT a.*, b.branch_name_1, b.city as branch_city
                    FROM agent a
                    LEFT JOIN branch b ON a.branch_id = b.branch_id
                    WHERE a.agent_id = $1
                `, [user.agent_id])
            ]);

            const uniqueCustomers = new Set(policies.rows.map(p => p.customer_id)).size;
            const totalPolicies = policies.rows.length;
            const activePolicies = policies.rows.filter(p => (p.policy_status || "").toLowerCase() === "active").length;
            const totalClaims = claims.rows.length;
            const pendingClaims = claims.rows.filter(c => ["pending", "under review"].includes((c.claim_status || "").toLowerCase())).length;

            return res.json({
                role: "AGENT",
                agent: agentInfo.rows[0] || null,
                stats: {
                    totalAssignedPolicies: totalPolicies,
                    activePolicies,
                    assignedCustomers: uniqueCustomers,
                    totalClaims,
                    pendingClaims,
                    totalPayments: payments.rows.length
                },
                recentPolicies: policies.rows.slice(0, 5),
                recentClaims: claims.rows.slice(0, 5),
                recentPayments: payments.rows.slice(0, 5)
            });
        }

        if (user.role === "SURVEYOR" && user.surveyor_id) {
            // Surveyor-specific dashboard
            const [claims, surveyorInfo] = await Promise.all([
                pool.query(`
                    SELECT cl.*, p.policy_no, pt.policy_name, c.first_name || ' ' || c.last_name AS customer_name, c.mobile_no AS customer_mobile
                    FROM claim cl
                    JOIN policy p ON cl.policy_id = p.policy_id
                    LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
                    JOIN customer c ON p.customer_id = c.customer_id
                    WHERE cl.surveyor_id = $1
                    ORDER BY cl.claim_date DESC
                `, [user.surveyor_id]),
                pool.query("SELECT * FROM surveyor WHERE surveyor_id = $1", [user.surveyor_id])
            ]);

            const totalAssignedClaims = claims.rows.length;
            const pendingInspection = claims.rows.filter(c => ["pending", "under review"].includes((c.claim_status || "").toLowerCase())).length;
            const approvedClaims = claims.rows.filter(c => (c.claim_status || "").toLowerCase() === "approved").length;
            const totalApprovedAmt = claims.rows.reduce((sum, c) => sum + parseFloat(c.approve_amt || 0), 0);

            return res.json({
                role: "SURVEYOR",
                surveyor: surveyorInfo.rows[0] || null,
                stats: {
                    totalAssignedClaims,
                    pendingInspection,
                    approvedClaims,
                    totalApprovedAmt
                },
                assignedClaims: claims.rows
            });
        }

        // Default: Admin Dashboard (System-wide stats)
        const [
            custCount,
            activePolCount,
            totalPolCount,
            totalClaimCount,
            pendingClaimCount,
            agentCount,
            surveyorCount,
            branchCount,
            paymentCount,
            totalRevenue,
            totalSettledClaims,
            pendingApprovalsCount,
            recentPolicies,
            recentClaims,
            recentPayments,
            categoryStats
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM customer"),
            pool.query("SELECT COUNT(*) FROM policy WHERE LOWER(policy_status) = 'active'"),
            pool.query("SELECT COUNT(*) FROM policy"),
            pool.query("SELECT COUNT(*) FROM claim"),
            pool.query("SELECT COUNT(*) FROM claim WHERE LOWER(claim_status) IN ('pending', 'under review')"),
            pool.query("SELECT COUNT(*) FROM agent a LEFT JOIN users u ON a.agent_id = u.agent_id WHERE (u.status = 'APPROVED' OR (u.status IS NULL AND a.license_no IS NOT NULL))"),
            pool.query("SELECT COUNT(*) FROM surveyor s LEFT JOIN users u ON s.surveyor_id = u.surveyor_id WHERE (u.status = 'APPROVED' OR (u.status IS NULL AND s.license_no IS NOT NULL))"),
            pool.query("SELECT COUNT(*) FROM branch"),
            pool.query("SELECT COUNT(*) FROM premium_payment"),
            pool.query("SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM premium_payment WHERE LOWER(payment_status) IN ('successful', 'paid', 'completed')"),
            pool.query("SELECT COALESCE(SUM(approve_amt), 0) AS total_settled FROM claim WHERE LOWER(claim_status) IN ('approved', 'settled')"),
            pool.query("SELECT COUNT(*) FROM users WHERE status = 'PENDING'"),
            pool.query(`
                SELECT p.policy_id, p.policy_no, p.start_date, p.premium_amt, p.policy_status,
                       c.first_name || ' ' || c.last_name AS customer_name,
                       pt.policy_name, pt.category
                FROM policy p
                LEFT JOIN customer c ON p.customer_id = c.customer_id
                LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
                ORDER BY p.policy_id DESC
                LIMIT 5
            `),
            pool.query(`
                SELECT cl.claim_id, cl.policy_id, cl.claim_date, cl.claim_amount, cl.claim_status, cl.approve_amt,
                       p.policy_no, c.first_name || ' ' || c.last_name AS customer_name,
                       s.surveyor_name
                FROM claim cl
                LEFT JOIN policy p ON cl.policy_id = p.policy_id
                LEFT JOIN customer c ON p.customer_id = c.customer_id
                LEFT JOIN surveyor s ON cl.surveyor_id = s.surveyor_id
                ORDER BY cl.claim_id DESC
                LIMIT 5
            `),
            pool.query(`
                SELECT py.payment_id, py.policy_id, py.payment_date, py.amount, py.payment_status, py.payment_mode,
                       p.policy_no, c.first_name || ' ' || c.last_name AS customer_name
                FROM premium_payment py
                LEFT JOIN policy p ON py.policy_id = p.policy_id
                LEFT JOIN customer c ON p.customer_id = c.customer_id
                ORDER BY py.payment_id DESC
                LIMIT 5
            `),
            pool.query(`
                SELECT pt.category, COUNT(p.policy_id) as count
                FROM policy_type pt
                LEFT JOIN policy p ON pt.policy_type_id = p.policy_type_id
                GROUP BY pt.category
            `)
        ]);

        res.json({
            role: "ADMIN",
            stats: {
                totalCustomers: parseInt(custCount.rows[0].count, 10),
                activePolicies: parseInt(activePolCount.rows[0].count, 10),
                totalPolicies: parseInt(totalPolCount.rows[0].count, 10),
                totalClaims: parseInt(totalClaimCount.rows[0].count, 10),
                pendingClaims: parseInt(pendingClaimCount.rows[0].count, 10),
                totalAgents: parseInt(agentCount.rows[0].count, 10),
                totalSurveyors: parseInt(surveyorCount.rows[0].count, 10),
                totalBranches: parseInt(branchCount.rows[0].count, 10),
                totalPremiumPayments: parseInt(paymentCount.rows[0].count, 10),
                totalRevenue: parseFloat(totalRevenue.rows[0].total_revenue),
                totalSettledClaims: parseFloat(totalSettledClaims.rows[0].total_settled),
                pendingApprovals: parseInt(pendingApprovalsCount.rows[0].count, 10)
            },
            recentPolicies: recentPolicies.rows,
            recentClaims: recentClaims.rows,
            recentPayments: recentPayments.rows,
            categoryStats: categoryStats.rows
        });
    } catch (err) {
        console.error("Error fetching dashboard statistics:", err.message);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

module.exports = {
    getDashboardStats
};

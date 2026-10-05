const pool = require("../db");

// Get single policy with joined information
const getPolicyById = async (req, res) => {
    try {
        const policyId = req.params.id;
        const user = req.user;

        const result = await pool.query(
            `SELECT
                p.policy_id,
                p.policy_no,
                p.start_date,
                p.end_date,
                p.premium_amt,
                p.sum_coverage,
                p.policy_status,
                p.payment_freq,
                p.created_date,

                c.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name,
                c.mobile_no AS customer_mobile,
                c.email AS customer_email,

                pt.policy_type_id,
                pt.policy_name,
                pt.category,

                a.agent_id,
                a.agent_name,
                a.mobile_no AS agent_mobile,
                a.email AS agent_email

             FROM policy p

             INNER JOIN customer c
                ON p.customer_id = c.customer_id

             INNER JOIN policy_type pt
                ON p.policy_type_id = pt.policy_type_id

             LEFT JOIN agent a
                ON p.agent_id = a.agent_id

             WHERE p.policy_id = $1`,
            [policyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Policy not found"
            });
        }

        const policy = result.rows[0];

        // Ownership check for customers
        if (user && user.role === "CUSTOMER" && user.customer_id && policy.customer_id !== user.customer_id) {
            return res.status(403).json({ error: "Access denied. You can only view your own policies." });
        }

        // Fetch related asset/nominee info in parallel
        const [vehicles, properties, businesses, nominees] = await Promise.all([
            pool.query("SELECT * FROM vehicle WHERE policy_id = $1", [policyId]),
            pool.query("SELECT * FROM property WHERE policy_id = $1", [policyId]),
            pool.query("SELECT * FROM business WHERE policy_id = $1", [policyId]),
            pool.query("SELECT * FROM nominee WHERE policy_id = $1", [policyId])
        ]);

        policy.vehicle = vehicles.rows[0] || null;
        policy.property = properties.rows[0] || null;
        policy.business = businesses.rows[0] || null;
        policy.nominees = nominees.rows;

        res.json(policy);

    } catch (err) {
        console.error("Error fetching policy:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy"
        });
    }
};

const getPolicyPayments = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `SELECT
                payment_id,
                policy_id,
                payment_date,
                amount,
                payment_mode,
                payment_status
             FROM premium_payment
             WHERE policy_id = $1
             ORDER BY payment_date DESC`,
            [policyId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policy payments:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy payments"
        });
    }
};

const getPolicyClaims = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `SELECT
                c.claim_id,
                c.policy_id,
                c.claim_date,
                c.claim_amount,
                c.claim_status,
                c.description,
                c.surveyor_id,
                c.approve_amt,
                s.surveyor_name
             FROM claim c
             LEFT JOIN surveyor s ON c.surveyor_id = s.surveyor_id
             WHERE c.policy_id = $1
             ORDER BY c.claim_date DESC`,
            [policyId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policy claims:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy claims"
        });
    }
};

const getPolicyVehicle = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `SELECT
                vehicle_id,
                policy_id,
                reg_no,
                manufacturer,
                model,
                engine_no
             FROM vehicle
             WHERE policy_id = $1`,
            [policyId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policy vehicle:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy vehicle"
        });
    }
};

const getPolicyProperty = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `SELECT
                property_id,
                policy_id,
                property_type,
                address,
                city,
                state,
                construction_year,
                market_value,
                usage_type
             FROM property
             WHERE policy_id = $1`,
            [policyId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policy property:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy property"
        });
    }
};

const getPolicyBusiness = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `SELECT
                business_id,
                policy_id,
                business_name,
                industry_type,
                address,
                gst_no,
                annual_turnover,
                employee_count
             FROM business
             WHERE policy_id = $1`,
            [policyId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policy business:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy business"
        });
    }
};

const getPolicyNominees = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `SELECT
                nominee_id,
                policy_id,
                nominee_name,
                relationship,
                dob,
                mobile_no
             FROM nominee
             WHERE policy_id = $1
             ORDER BY nominee_id`,
            [policyId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policy nominees:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy nominees"
        });
    }
};

const getPolicies = async (req, res) => {
    try {
        const { status, customer_id, policy_type_id, agent_id, search } = req.query;
        const user = req.user;

        let query = `
            SELECT
                p.policy_id,
                p.policy_no,
                p.start_date,
                p.end_date,
                p.premium_amt,
                p.sum_coverage,
                p.policy_status,
                p.payment_freq,
                p.created_date,

                c.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name,
                c.email AS customer_email,

                pt.policy_type_id,
                pt.policy_name,
                pt.category,

                a.agent_id,
                a.agent_name

             FROM policy p

             INNER JOIN customer c
                ON p.customer_id = c.customer_id

             INNER JOIN policy_type pt
                ON p.policy_type_id = pt.policy_type_id

             LEFT JOIN agent a
                ON p.agent_id = a.agent_id

             WHERE 1=1
        `;

        const params = [];

        // Role-based restrictions
        if (user && user.role === "CUSTOMER" && user.customer_id) {
            params.push(user.customer_id);
            query += ` AND p.customer_id = $${params.length}`;
        } else if (user && user.role === "AGENT" && user.agent_id) {
            params.push(user.agent_id);
            query += ` AND p.agent_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND LOWER(p.policy_status) = LOWER($${params.length})`;
        }

        if (customer_id) {
            params.push(customer_id);
            query += ` AND p.customer_id = $${params.length}`;
        }

        if (policy_type_id) {
            params.push(policy_type_id);
            query += ` AND p.policy_type_id = $${params.length}`;
        }

        if (agent_id) {
            params.push(agent_id);
            query += ` AND p.agent_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (p.policy_no ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR pt.policy_name ILIKE $${params.length})`;
        }

        query += " ORDER BY p.policy_id DESC";

        const result = await pool.query(query, params);

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching policies:", err.message);

        res.status(500).json({
            error: "Failed to fetch policies"
        });
    }
};

const createPolicy = async (req, res) => {
    try {
        const {
            customer_id,
            policy_type_id,
            start_date,
            end_date,
            premium_amt,
            agent_id,
            policy_no,
            sum_coverage,
            policy_status,
            payment_freq
        } = req.body;

        if (!customer_id || !policy_type_id || !premium_amt || !sum_coverage) {
            return res.status(400).json({ error: "Customer, policy type, premium, and coverage amount are required" });
        }

        // Auto-generate policy_no if not provided
        const genPolicyNo = policy_no || `POL-${Date.now().toString().slice(-6)}`;

        const result = await pool.query(
            `INSERT INTO policy (
                customer_id,
                policy_type_id,
                start_date,
                end_date,
                premium_amt,
                agent_id,
                policy_no,
                sum_coverage,
                policy_status,
                payment_freq
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
            )
            RETURNING *`,
            [
                customer_id,
                policy_type_id,
                start_date || new Date().toISOString().split("T")[0],
                end_date || null,
                premium_amt,
                agent_id || null,
                genPolicyNo,
                sum_coverage,
                policy_status || "ACTIVE",
                payment_freq || "Monthly"
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating policy:", err.message);

        res.status(500).json({
            error: "Failed to create policy: " + err.message
        });
    }
};

const updatePolicy = async (req, res) => {
    try {
        const policyId = req.params.id;
        const {
            policy_no,
            start_date,
            end_date,
            premium_amt,
            sum_coverage,
            policy_status,
            payment_freq,
            agent_id,
            policy_type_id
        } = req.body;

        const result = await pool.query(
            `UPDATE policy
             SET
                policy_no = COALESCE($1, policy_no),
                start_date = COALESCE($2, start_date),
                end_date = COALESCE($3, end_date),
                premium_amt = COALESCE($4, premium_amt),
                sum_coverage = COALESCE($5, sum_coverage),
                policy_status = COALESCE($6, policy_status),
                payment_freq = COALESCE($7, payment_freq),
                agent_id = COALESCE($8, agent_id),
                policy_type_id = COALESCE($9, policy_type_id)
             WHERE policy_id = $10
             RETURNING *`,
            [
                policy_no || null,
                start_date || null,
                end_date || null,
                premium_amt !== undefined ? premium_amt : null,
                sum_coverage !== undefined ? sum_coverage : null,
                policy_status || null,
                payment_freq || null,
                agent_id !== undefined ? (agent_id === "" ? null : agent_id) : null,
                policy_type_id || null,
                policyId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Policy not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating policy:", err.message);

        res.status(500).json({
            error: "Failed to update policy"
        });
    }
};

const updatePolicyStatus = async (req, res) => {
    try {
        const policyId = req.params.id;
        const { policy_status } = req.body;

        const result = await pool.query(
            `UPDATE policy
             SET policy_status = $1
             WHERE policy_id = $2
             RETURNING *`,
            [policy_status, policyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Policy not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating policy status:", err.message);

        res.status(500).json({
            error: "Failed to update policy status"
        });
    }
};

const deletePolicy = async (req, res) => {
    try {
        const policyId = req.params.id;

        const result = await pool.query(
            `DELETE FROM policy
             WHERE policy_id = $1
             RETURNING *`,
            [policyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Policy not found"
            });
        }

        res.json({
            message: "Policy deleted successfully",
            policy: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting policy:", err.message);

        res.status(500).json({
            error: "Failed to delete policy"
        });
    }
};

module.exports = {
    getPolicies,
    getPolicyById,
    getPolicyPayments,
    getPolicyClaims,
    getPolicyVehicle,
    getPolicyProperty,
    getPolicyBusiness,
    getPolicyNominees,
    createPolicy,
    updatePolicy,
    updatePolicyStatus,
    deletePolicy
};
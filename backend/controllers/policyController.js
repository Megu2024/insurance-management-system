const pool = require("../db");

const getPolicyById = async (req, res) => {
    try {
        const policyId = req.params.id;

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

             INNER JOIN agent a
                ON p.agent_id = a.agent_id

             WHERE p.policy_id = $1`,
            [policyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Policy not found"
            });
        }

        res.json(result.rows[0]);

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
             ORDER BY payment_date`,
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
                claim_id,
                policy_id,
                claim_date,
                claim_amount,
                claim_status,
                description,
                surveyor_id,
                approve_amt
             FROM claim
             WHERE policy_id = $1
             ORDER BY claim_date`,
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

             INNER JOIN agent a
                ON p.agent_id = a.agent_id

             ORDER BY p.policy_id`
        );

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
                start_date,
                end_date,
                premium_amt,
                agent_id,
                policy_no,
                sum_coverage,
                policy_status,
                payment_freq
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating policy:", err.message);

        res.status(500).json({
            error: "Failed to create policy"
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
    updatePolicyStatus,
    deletePolicy
};
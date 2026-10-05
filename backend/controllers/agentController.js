const pool = require("../db");

const getAgents = async (req, res) => {
    try {
        const { search, branch_id, include_pending } = req.query;

        let query = `
            SELECT
                a.agent_id,
                a.branch_id,
                a.agent_name,
                a.mobile_no,
                a.email,
                a.license_no,
                COALESCE(u.status, 'APPROVED') AS user_status,
                b.branch_name_1,
                b.city AS branch_city,
                COUNT(p.policy_id) AS total_policies
            FROM agent a
            LEFT JOIN users u ON a.agent_id = u.agent_id
            LEFT JOIN branch b ON a.branch_id = b.branch_id
            LEFT JOIN policy p ON a.agent_id = p.agent_id
            WHERE 1=1
        `;

        const params = [];

        // By default, only return approved active agents who have a valid license
        if (include_pending !== "true") {
            query += " AND (u.status = 'APPROVED' OR (u.status IS NULL AND a.license_no IS NOT NULL))";
        }

        if (branch_id) {
            params.push(branch_id);
            query += ` AND a.branch_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (a.agent_name ILIKE $${params.length} OR a.email ILIKE $${params.length} OR a.license_no ILIKE $${params.length} OR b.branch_name_1 ILIKE $${params.length})`;
        }

        query += `
            GROUP BY a.agent_id, a.branch_id, a.agent_name, a.mobile_no, a.email, a.license_no, u.status, b.branch_name_1, b.city
            ORDER BY a.agent_id
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching agents:", err.message);

        res.status(500).json({
            error: "Failed to fetch agents"
        });
    }
};

const getAgentById = async (req, res) => {
    try {
        const agentId = req.params.id;

        const result = await pool.query(
            `SELECT
                a.agent_id,
                a.agent_name,
                a.mobile_no,
                a.email,
                a.license_no,

                b.branch_id,
                b.branch_name_1,
                b.city AS branch_city,
                b.state AS branch_state,
                b.manager_name,
                b.phone AS branch_phone

             FROM agent a

             LEFT JOIN branch b
                ON a.branch_id = b.branch_id

             WHERE a.agent_id = $1`,
            [agentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Agent not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error fetching agent:", err.message);

        res.status(500).json({
            error: "Failed to fetch agent"
        });
    }
};

const getAgentPolicies = async (req, res) => {
    try {
        const agentId = req.params.id;

        const result = await pool.query(
            `SELECT
                p.*,
                pt.policy_name,
                pt.category,
                c.first_name || ' ' || c.last_name AS customer_name,
                c.email AS customer_email,
                c.mobile_no AS customer_mobile
             FROM policy p
             LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
             JOIN customer c ON p.customer_id = c.customer_id
             WHERE p.agent_id = $1
             ORDER BY p.policy_id DESC`,
            [agentId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching agent policies:", err.message);
        res.status(500).json({ error: "Failed to fetch agent policies" });
    }
};

const getAgentCustomers = async (req, res) => {
    try {
        const agentId = req.params.id;

        const result = await pool.query(
            `SELECT DISTINCT
                c.customer_id,
                c.first_name,
                c.last_name,
                c.email,
                c.mobile_no,
                c.city,
                c.customer_status
             FROM customer c
             JOIN policy p ON c.customer_id = p.customer_id
             WHERE p.agent_id = $1
             ORDER BY c.customer_id`,
            [agentId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching agent customers:", err.message);
        res.status(500).json({ error: "Failed to fetch agent customers" });
    }
};

const createAgent = async (req, res) => {
    try {
        const { branch_id, agent_name, mobile_no, email, license_no } = req.body;

        if (!agent_name) {
            return res.status(400).json({ error: "Agent name is required" });
        }

        const finalLicense = license_no && license_no.trim() !== ""
            ? license_no.trim()
            : `LIC-AGT-${Math.floor(100000 + Math.random() * 900000)}`;

        const result = await pool.query(
            `INSERT INTO agent (branch_id, agent_name, mobile_no, email, license_no)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                branch_id ? parseInt(branch_id, 10) : null,
                agent_name.trim(),
                mobile_no || null,
                email ? email.trim() : null,
                finalLicense
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating agent:", err.message);
        res.status(500).json({ error: "Failed to create agent" });
    }
};

const updateAgent = async (req, res) => {
    try {
        const agentId = req.params.id;
        const { branch_id, agent_name, mobile_no, email, license_no } = req.body;

        const result = await pool.query(
            `UPDATE agent
             SET branch_id = COALESCE($1, branch_id),
                 agent_name = COALESCE($2, agent_name),
                 mobile_no = COALESCE($3, mobile_no),
                 email = COALESCE($4, email),
                 license_no = COALESCE($5, license_no)
             WHERE agent_id = $6
             RETURNING *`,
            [
                branch_id !== undefined ? (branch_id === "" ? null : parseInt(branch_id, 10)) : null,
                agent_name ? agent_name.trim() : null,
                mobile_no || null,
                email ? email.trim() : null,
                license_no ? license_no.trim() : null,
                agentId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Agent not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating agent:", err.message);
        res.status(500).json({ error: "Failed to update agent" });
    }
};

const deleteAgent = async (req, res) => {
    try {
        const agentId = req.params.id;

        const result = await pool.query(
            "DELETE FROM agent WHERE agent_id = $1 RETURNING *",
            [agentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Agent not found" });
        }

        res.json({ message: "Agent deleted successfully", agent: result.rows[0] });
    } catch (err) {
        console.error("Error deleting agent:", err.message);
        res.status(500).json({ error: "Failed to delete agent" });
    }
};

module.exports = {
    getAgents,
    getAgentById,
    getAgentPolicies,
    getAgentCustomers,
    createAgent,
    updateAgent,
    deleteAgent
};
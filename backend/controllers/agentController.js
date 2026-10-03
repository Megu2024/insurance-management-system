const pool = require("../db");

const getAgents = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                agent_id,
                branch_id,
                agent_name,
                mobile_no,
                email,
                license_no
             FROM agent
             ORDER BY agent_id`
        );

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

             INNER JOIN branch b
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

module.exports = {
    getAgents,
    getAgentById
};
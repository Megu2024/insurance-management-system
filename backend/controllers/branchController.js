const pool = require("../db");

const getBranches = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                b.branch_id,
                b.branch_name_1,
                b.city,
                b.state,
                b.manager_name,
                b.phone,
                COUNT(a.agent_id) AS agent_count
             FROM branch b
             LEFT JOIN agent a
                ON b.branch_id = a.branch_id
             GROUP BY
                b.branch_id,
                b.branch_name_1,
                b.city,
                b.state,
                b.manager_name,
                b.phone
             ORDER BY b.branch_id`
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching branches:", err.message);

        res.status(500).json({
            error: "Failed to fetch branches"
        });
    }
};

module.exports = {
    getBranches
};
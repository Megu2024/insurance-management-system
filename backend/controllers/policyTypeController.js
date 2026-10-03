const pool = require("../db");

const getPolicyTypes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM policy_type
             ORDER BY policy_type_id`
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error fetching policy types:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy types"
        });
    }
};

module.exports = {
    getPolicyTypes
};
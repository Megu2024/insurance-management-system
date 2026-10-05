const pool = require("../db");

const getPolicyTypes = async (req, res) => {
    try {
        const { search, category } = req.query;

        let query = "SELECT * FROM policy_type WHERE 1=1";
        const params = [];

        if (category) {
            params.push(category);
            query += ` AND LOWER(category) = LOWER($${params.length})`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (policy_name ILIKE $${params.length} OR category ILIKE $${params.length})`;
        }

        query += " ORDER BY policy_type_id";

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error fetching policy types:", err.message);

        res.status(500).json({
            error: "Failed to fetch policy types"
        });
    }
};

const getPolicyTypeById = async (req, res) => {
    try {
        const typeId = req.params.id;

        const result = await pool.query(
            "SELECT * FROM policy_type WHERE policy_type_id = $1",
            [typeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Policy type not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching policy type:", err.message);
        res.status(500).json({ error: "Failed to fetch policy type" });
    }
};

const createPolicyType = async (req, res) => {
    try {
        const { policy_name, category } = req.body;

        if (!policy_name || !category) {
            return res.status(400).json({ error: "Policy name and category are required" });
        }

        const result = await pool.query(
            `INSERT INTO policy_type (policy_name, category)
             VALUES ($1, $2)
             RETURNING *`,
            [policy_name.trim(), category.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating policy type:", err.message);
        res.status(500).json({ error: "Failed to create policy type" });
    }
};

const updatePolicyType = async (req, res) => {
    try {
        const typeId = req.params.id;
        const { policy_name, category } = req.body;

        const result = await pool.query(
            `UPDATE policy_type
             SET policy_name = COALESCE($1, policy_name),
                 category = COALESCE($2, category)
             WHERE policy_type_id = $3
             RETURNING *`,
            [
                policy_name ? policy_name.trim() : null,
                category ? category.trim() : null,
                typeId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Policy type not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating policy type:", err.message);
        res.status(500).json({ error: "Failed to update policy type" });
    }
};

const deletePolicyType = async (req, res) => {
    try {
        const typeId = req.params.id;

        const result = await pool.query(
            "DELETE FROM policy_type WHERE policy_type_id = $1 RETURNING *",
            [typeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Policy type not found" });
        }

        res.json({ message: "Policy type deleted successfully", policyType: result.rows[0] });
    } catch (err) {
        console.error("Error deleting policy type:", err.message);
        res.status(500).json({ error: "Failed to delete policy type: " + err.message });
    }
};

module.exports = {
    getPolicyTypes,
    getPolicyTypeById,
    createPolicyType,
    updatePolicyType,
    deletePolicyType
};
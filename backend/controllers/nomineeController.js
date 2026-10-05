const pool = require("../db");

// Get all nominees with linked policy & customer info
const getNominees = async (req, res) => {
    try {
        const { search, policy_id } = req.query;
        const user = req.user;

        let query = `
            SELECT
                n.*,
                p.policy_no,
                p.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name
            FROM nominee n
            JOIN policy p ON n.policy_id = p.policy_id
            JOIN customer c ON p.customer_id = c.customer_id
            WHERE 1=1
        `;

        const params = [];

        if (user && user.role === "CUSTOMER" && user.customer_id) {
            params.push(user.customer_id);
            query += ` AND p.customer_id = $${params.length}`;
        }

        if (policy_id) {
            params.push(policy_id);
            query += ` AND n.policy_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (n.nominee_name ILIKE $${params.length} OR n.relationship ILIKE $${params.length} OR p.policy_no ILIKE $${params.length})`;
        }

        query += " ORDER BY n.nominee_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching nominees:", err.message);
        res.status(500).json({ error: "Failed to fetch nominees" });
    }
};

// Get single nominee by ID
const getNomineeById = async (req, res) => {
    try {
        const nomineeId = req.params.id;

        const result = await pool.query(
            `SELECT n.*, p.policy_no, p.customer_id, c.first_name || ' ' || c.last_name AS customer_name
             FROM nominee n
             JOIN policy p ON n.policy_id = p.policy_id
             JOIN customer c ON p.customer_id = c.customer_id
             WHERE n.nominee_id = $1`,
            [nomineeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Nominee not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching nominee:", err.message);
        res.status(500).json({ error: "Failed to fetch nominee" });
    }
};

const createNominee = async (req, res) => {
    try {
        const {
            policy_id,
            nominee_name,
            relationship,
            dob,
            mobile_no
        } = req.body;

        if (!policy_id || !nominee_name) {
            return res.status(400).json({ error: "Policy ID and nominee name are required" });
        }

        const result = await pool.query(
            `INSERT INTO nominee
                (policy_id, nominee_name, relationship, dob, mobile_no)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                policy_id,
                nominee_name.trim(),
                relationship || null,
                dob || null,
                mobile_no || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating nominee:", err.message);

        res.status(500).json({
            error: "Failed to create nominee"
        });
    }
};

const updateNominee = async (req, res) => {
    try {
        const nomineeId = req.params.id;

        const {
            nominee_name,
            relationship,
            dob,
            mobile_no,
            policy_id
        } = req.body;

        const result = await pool.query(
            `UPDATE nominee
             SET
                nominee_name = COALESCE($1, nominee_name),
                relationship = COALESCE($2, relationship),
                dob = COALESCE($3, dob),
                mobile_no = COALESCE($4, mobile_no),
                policy_id = COALESCE($5, policy_id)
             WHERE nominee_id = $6
             RETURNING *`,
            [
                nominee_name ? nominee_name.trim() : null,
                relationship || null,
                dob || null,
                mobile_no || null,
                policy_id || null,
                nomineeId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Nominee not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating nominee:", err.message);

        res.status(500).json({
            error: "Failed to update nominee"
        });
    }
};

const deleteNominee = async (req, res) => {
    try {
        const nomineeId = req.params.id;

        const result = await pool.query(
            `DELETE FROM nominee
             WHERE nominee_id = $1
             RETURNING *`,
            [nomineeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Nominee not found"
            });
        }

        res.json({
            message: "Nominee deleted successfully",
            nominee: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting nominee:", err.message);

        res.status(500).json({
            error: "Failed to delete nominee"
        });
    }
};

module.exports = {
    getNominees,
    getNomineeById,
    createNominee,
    updateNominee,
    deleteNominee
};
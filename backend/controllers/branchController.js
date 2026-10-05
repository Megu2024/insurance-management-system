const pool = require("../db");

const getBranches = async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT
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
            WHERE 1=1
        `;

        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (b.branch_name_1 ILIKE $${params.length} OR b.city ILIKE $${params.length} OR b.manager_name ILIKE $${params.length})`;
        }

        query += `
            GROUP BY
                b.branch_id,
                b.branch_name_1,
                b.city,
                b.state,
                b.manager_name,
                b.phone
            ORDER BY b.branch_id
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching branches:", err.message);

        res.status(500).json({
            error: "Failed to fetch branches"
        });
    }
};

const getBranchById = async (req, res) => {
    try {
        const branchId = req.params.id;

        const result = await pool.query(
            "SELECT * FROM branch WHERE branch_id = $1",
            [branchId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Branch not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching branch:", err.message);
        res.status(500).json({ error: "Failed to fetch branch" });
    }
};

const getBranchAgents = async (req, res) => {
    try {
        const branchId = req.params.id;

        const result = await pool.query(
            "SELECT * FROM agent WHERE branch_id = $1 ORDER BY agent_id",
            [branchId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching branch agents:", err.message);
        res.status(500).json({ error: "Failed to fetch branch agents" });
    }
};

const createBranch = async (req, res) => {
    try {
        const { branch_name_1, phone, city, state, manager_name } = req.body;

        if (!branch_name_1) {
            return res.status(400).json({ error: "Branch name is required" });
        }

        const result = await pool.query(
            `INSERT INTO branch (branch_name_1, phone, city, state, manager_name)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                branch_name_1.trim(),
                phone || null,
                city || null,
                state || null,
                manager_name ? manager_name.trim() : null
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating branch:", err.message);
        res.status(500).json({ error: "Failed to create branch" });
    }
};

const updateBranch = async (req, res) => {
    try {
        const branchId = req.params.id;
        const { branch_name_1, phone, city, state, manager_name } = req.body;

        const result = await pool.query(
            `UPDATE branch
             SET branch_name_1 = COALESCE($1, branch_name_1),
                 phone = COALESCE($2, phone),
                 city = COALESCE($3, city),
                 state = COALESCE($4, state),
                 manager_name = COALESCE($5, manager_name)
             WHERE branch_id = $6
             RETURNING *`,
            [
                branch_name_1 ? branch_name_1.trim() : null,
                phone || null,
                city || null,
                state || null,
                manager_name ? manager_name.trim() : null,
                branchId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Branch not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating branch:", err.message);
        res.status(500).json({ error: "Failed to update branch" });
    }
};

const deleteBranch = async (req, res) => {
    const client = await pool.connect();
    try {
        const branchId = req.params.id;

        await client.query("BEGIN");

        // 1. Check if branch exists
        const branchRes = await client.query(
            "SELECT * FROM branch WHERE branch_id = $1",
            [branchId]
        );

        if (branchRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Branch not found" });
        }

        // 2. Unlink any agents associated with this branch
        await client.query(
            "UPDATE agent SET branch_id = NULL WHERE branch_id = $1",
            [branchId]
        );

        // 3. Delete the branch
        const result = await client.query(
            "DELETE FROM branch WHERE branch_id = $1 RETURNING *",
            [branchId]
        );

        await client.query("COMMIT");

        res.json({ message: "Branch deleted successfully and assigned agents unlinked", branch: result.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting branch:", err.message);
        res.status(500).json({ error: "Failed to delete branch: " + err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getBranches,
    getBranchById,
    getBranchAgents,
    createBranch,
    updateBranch,
    deleteBranch
};
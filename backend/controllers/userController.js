const pool = require("../db");

// Get all users (Admin only)
const getUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;

        let query = `
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.role,
                u.status,
                u.customer_id,
                u.agent_id,
                u.surveyor_id,
                u.created_at,
                COALESCE(c.first_name || ' ' || c.last_name, a.agent_name, s.surveyor_name, 'Admin') AS full_name,
                COALESCE(c.mobile_no, a.mobile_no, s.phone) AS mobile_no
            FROM users u
            LEFT JOIN customer c ON u.customer_id = c.customer_id
            LEFT JOIN agent a ON u.agent_id = a.agent_id
            LEFT JOIN surveyor s ON u.surveyor_id = s.surveyor_id
            WHERE 1=1
        `;

        const params = [];

        if (role) {
            params.push(role);
            query += ` AND u.role = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND u.status = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.email ILIKE $${params.length} OR u.username ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR a.agent_name ILIKE $${params.length} OR s.surveyor_name ILIKE $${params.length})`;
        }

        query += " ORDER BY u.created_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// Get pending agent and surveyor approvals
const getPendingApprovals = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.role,
                u.status,
                u.created_at,
                u.agent_id,
                u.surveyor_id,
                a.agent_name,
                a.mobile_no AS agent_mobile,
                a.license_no AS agent_license,
                b.branch_name_1,
                b.city AS branch_city,
                s.surveyor_name,
                s.phone AS surveyor_phone,
                s.license_no AS surveyor_license,
                s.experience AS surveyor_experience
            FROM users u
            LEFT JOIN agent a ON u.agent_id = a.agent_id
            LEFT JOIN branch b ON a.branch_id = b.branch_id
            LEFT JOIN surveyor s ON u.surveyor_id = s.surveyor_id
            WHERE u.status = 'PENDING'
            ORDER BY u.created_at ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching pending approvals:", err.message);
        res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
};

// Approve user account (Auto-generates official license number and activates account)
const approveUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.params.id;
        const { branch_id, license_no } = req.body || {};

        await client.query("BEGIN");

        const userResult = await client.query(
            "SELECT * FROM users WHERE user_id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];
        let issuedLicense = null;

        // 1. If AGENT: auto-generate official license number & assign branch
        if (user.role === "AGENT" && user.agent_id) {
            const agentRes = await client.query(
                "SELECT * FROM agent WHERE agent_id = $1",
                [user.agent_id]
            );
            const currentAgent = agentRes.rows[0];

            issuedLicense = license_no || currentAgent?.license_no;
            if (!issuedLicense || issuedLicense.toUpperCase().includes("PENDING") || issuedLicense === "—" || issuedLicense.trim() === "") {
                issuedLicense = `LIC-AGT-${Math.floor(100000 + Math.random() * 900000)}`;
            }

            let assignedBranch = branch_id ? parseInt(branch_id, 10) : currentAgent?.branch_id;
            if (!assignedBranch) {
                const firstBranch = await client.query(
                    "SELECT branch_id FROM branch ORDER BY branch_id ASC LIMIT 1"
                );
                if (firstBranch.rows.length > 0) {
                    assignedBranch = firstBranch.rows[0].branch_id;
                }
            }

            await client.query(
                "UPDATE agent SET license_no = $1, branch_id = COALESCE($2, branch_id) WHERE agent_id = $3",
                [issuedLicense, assignedBranch, user.agent_id]
            );
        }

        // 2. If SURVEYOR: auto-generate official surveyor license number
        if (user.role === "SURVEYOR" && user.surveyor_id) {
            const surRes = await client.query(
                "SELECT * FROM surveyor WHERE surveyor_id = $1",
                [user.surveyor_id]
            );
            const currentSur = surRes.rows[0];

            issuedLicense = license_no || currentSur?.license_no;
            if (!issuedLicense || issuedLicense.toUpperCase().includes("PENDING") || issuedLicense === "—" || issuedLicense.trim() === "") {
                issuedLicense = `LIC-SUR-${Math.floor(100000 + Math.random() * 900000)}`;
            }

            await client.query(
                "UPDATE surveyor SET license_no = $1 WHERE surveyor_id = $2",
                [issuedLicense, user.surveyor_id]
            );
        }

        const result = await client.query(
            "UPDATE users SET status = 'APPROVED' WHERE user_id = $1 RETURNING user_id, email, role, status",
            [userId]
        );

        await client.query("COMMIT");

        res.json({
            message: `${user.role} application approved successfully. Official license issued: ${issuedLicense || "Active"}`,
            user: result.rows[0],
            license_no: issuedLicense
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error approving user:", err.message);
        res.status(500).json({ error: "Failed to approve user: " + err.message });
    } finally {
        client.release();
    }
};

// Reject user account
const rejectUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const result = await pool.query(
            "UPDATE users SET status = 'REJECTED' WHERE user_id = $1 RETURNING user_id, email, role, status",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "User account rejected successfully",
            user: result.rows[0]
        });
    } catch (err) {
        console.error("Error rejecting user:", err.message);
        res.status(500).json({ error: "Failed to reject user" });
    }
};

// Update user status
const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;

        if (!['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE'].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        const result = await pool.query(
            "UPDATE users SET status = $1 WHERE user_id = $2 RETURNING user_id, email, role, status",
            [status, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating user status:", err.message);
        res.status(500).json({ error: "Failed to update user status" });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const result = await pool.query(
            "DELETE FROM users WHERE user_id = $1 RETURNING user_id, email, role",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully", user: result.rows[0] });
    } catch (err) {
        console.error("Error deleting user:", err.message);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

module.exports = {
    getUsers,
    getPendingApprovals,
    approveUser,
    rejectUser,
    updateUserStatus,
    deleteUser
};

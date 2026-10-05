const pool = require("../db");

// Get all claims with rich relational details and role-based filtering
const getClaims = async (req, res) => {
    try {
        const { status, policy_id, search } = req.query;
        const user = req.user;

        let query = `
            SELECT
                c.claim_id,
                c.policy_id,
                c.claim_date,
                c.claim_amount,
                c.claim_status,
                c.description,
                c.surveyor_id,
                c.approve_amt,

                p.policy_no,
                p.customer_id,
                p.sum_coverage,

                cust.first_name || ' ' || cust.last_name AS customer_name,
                cust.email AS customer_email,
                cust.mobile_no AS customer_mobile,

                pt.policy_name,
                pt.category,

                s.surveyor_name,
                s.phone AS surveyor_phone

            FROM claim c
            INNER JOIN policy p ON c.policy_id = p.policy_id
            INNER JOIN customer cust ON p.customer_id = cust.customer_id
            LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
            LEFT JOIN surveyor s ON c.surveyor_id = s.surveyor_id
            WHERE 1=1
        `;

        const params = [];

        // Role-based restrictions
        if (user && user.role === "CUSTOMER" && user.customer_id) {
            params.push(user.customer_id);
            query += ` AND p.customer_id = $${params.length}`;
        } else if (user && user.role === "SURVEYOR" && user.surveyor_id) {
            params.push(user.surveyor_id);
            query += ` AND c.surveyor_id = $${params.length}`;
        } else if (user && user.role === "AGENT" && user.agent_id) {
            params.push(user.agent_id);
            query += ` AND p.agent_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND LOWER(c.claim_status) = LOWER($${params.length})`;
        }

        if (policy_id) {
            params.push(policy_id);
            query += ` AND c.policy_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (p.policy_no ILIKE $${params.length} OR cust.first_name ILIKE $${params.length} OR cust.last_name ILIKE $${params.length} OR c.description ILIKE $${params.length} OR s.surveyor_name ILIKE $${params.length})`;
        }

        query += " ORDER BY c.claim_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching claims:", err.message);
        res.status(500).json({ error: "Failed to fetch claims" });
    }
};

// Get single claim by ID
const getClaimById = async (req, res) => {
    try {
        const claimId = req.params.id;

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

                p.policy_no,
                p.customer_id,
                p.sum_coverage,
                p.premium_amt,

                cust.first_name || ' ' || cust.last_name AS customer_name,
                cust.email AS customer_email,
                cust.mobile_no AS customer_mobile,

                pt.policy_name,
                pt.category,

                s.surveyor_name,
                s.phone AS surveyor_phone,
                s.email AS surveyor_email,
                s.license_no AS surveyor_license

             FROM claim c
             INNER JOIN policy p ON c.policy_id = p.policy_id
             INNER JOIN customer cust ON p.customer_id = cust.customer_id
             LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
             LEFT JOIN surveyor s ON c.surveyor_id = s.surveyor_id
             WHERE c.claim_id = $1`,
            [claimId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Claim not found" });
        }

        const claim = result.rows[0];

        // Also fetch any linked hospitals
        const hospitalRes = await pool.query(
            "SELECT * FROM hospital WHERE claim_id = $1",
            [claimId]
        );
        claim.hospitals = hospitalRes.rows;

        res.json(claim);
    } catch (err) {
        console.error("Error fetching claim:", err.message);
        res.status(500).json({ error: "Failed to fetch claim" });
    }
};

// Create Claim
const createClaim = async (req, res) => {
    try {
        const {
            policy_id,
            claim_date,
            claim_amount,
            claim_status,
            description,
            surveyor_id,
            approve_amt
        } = req.body;

        if (!policy_id || !claim_amount) {
            return res.status(400).json({ error: "Policy ID and claim amount are required" });
        }

        // Check ownership if user is customer
        if (req.user && req.user.role === "CUSTOMER" && req.user.customer_id) {
            const polCheck = await pool.query(
                "SELECT customer_id FROM policy WHERE policy_id = $1",
                [policy_id]
            );
            if (polCheck.rows.length === 0 || polCheck.rows[0].customer_id !== req.user.customer_id) {
                return res.status(403).json({ error: "You can only file claims on your own policies" });
            }
        }

        const result = await pool.query(
            `INSERT INTO claim
                (
                    policy_id,
                    claim_date,
                    claim_amount,
                    claim_status,
                    description,
                    surveyor_id,
                    approve_amt
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                policy_id,
                claim_date || new Date().toISOString().split("T")[0],
                claim_amount,
                claim_status || "Pending",
                description || null,
                surveyor_id || null,
                approve_amt || 0
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating claim:", err.message);
        res.status(500).json({ error: "Failed to create claim" });
    }
};

// Update Claim
const updateClaim = async (req, res) => {
    try {
        const claimId = req.params.id;

        const {
            claim_date,
            claim_amount,
            claim_status,
            description,
            surveyor_id,
            approve_amt
        } = req.body;

        const result = await pool.query(
            `UPDATE claim
             SET
                claim_date = COALESCE($1, claim_date),
                claim_amount = COALESCE($2, claim_amount),
                claim_status = COALESCE($3, claim_status),
                description = COALESCE($4, description),
                surveyor_id = COALESCE($5, surveyor_id),
                approve_amt = COALESCE($6, approve_amt)
             WHERE claim_id = $7
             RETURNING *`,
            [
                claim_date || null,
                claim_amount !== undefined ? claim_amount : null,
                claim_status || null,
                description !== undefined ? description : null,
                surveyor_id !== undefined ? (surveyor_id === "" ? null : surveyor_id) : null,
                approve_amt !== undefined ? approve_amt : null,
                claimId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Claim not found" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating claim:", err.message);
        res.status(500).json({ error: "Failed to update claim" });
    }
};

// Delete Claim
const deleteClaim = async (req, res) => {
    try {
        const claimId = req.params.id;

        const result = await pool.query(
            `DELETE FROM claim
             WHERE claim_id = $1
             RETURNING *`,
            [claimId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Claim not found" });
        }

        res.json({
            message: "Claim deleted successfully",
            claim: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting claim:", err.message);
        res.status(500).json({ error: "Failed to delete claim" });
    }
};

// Get Claim Hospital
const getClaimHospital = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM hospital
             WHERE claim_id = $1`,
            [id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error fetching claim hospital:", err.message);
        res.status(500).json({ error: "Failed to fetch claim hospital" });
    }
};

module.exports = {
    getClaims,
    getClaimById,
    createClaim,
    updateClaim,
    deleteClaim,
    getClaimHospital
};
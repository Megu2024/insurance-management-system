const pool = require("../db");

// Get all surveyors (by default only approved active surveyors)
const getSurveyors = async (req, res) => {
    try {
        const { search, include_pending } = req.query;
        let query = `
            SELECT
                s.surveyor_id,
                s.surveyor_name,
                s.phone,
                s.email,
                s.license_no,
                s.experience,
                COALESCE(u.status, 'APPROVED') AS user_status,
                COUNT(c.claim_id) AS assigned_claims_count
            FROM surveyor s
            LEFT JOIN users u ON s.surveyor_id = u.surveyor_id
            LEFT JOIN claim c ON s.surveyor_id = c.surveyor_id
            WHERE 1=1
        `;
        const params = [];

        // By default, only return approved surveyors
        if (include_pending !== "true") {
            query += " AND (u.status = 'APPROVED' OR (u.status IS NULL AND s.license_no IS NOT NULL))";
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (s.surveyor_name ILIKE $${params.length} OR s.license_no ILIKE $${params.length} OR s.email ILIKE $${params.length})`;
        }

        query += `
            GROUP BY s.surveyor_id, s.surveyor_name, s.phone, s.email, s.license_no, s.experience, u.status
            ORDER BY s.surveyor_id
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching surveyors:", err.message);
        res.status(500).json({ error: "Failed to fetch surveyors" });
    }
};

// Get surveyor by ID
const getSurveyorById = async (req, res) => {
    try {
        const surveyorId = req.params.id;

        const result = await pool.query(
            "SELECT * FROM surveyor WHERE surveyor_id = $1",
            [surveyorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Surveyor not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching surveyor:", err.message);
        res.status(500).json({ error: "Failed to fetch surveyor" });
    }
};

// Get claims assigned to surveyor
const getSurveyorClaims = async (req, res) => {
    try {
        const surveyorId = req.params.id;

        const result = await pool.query(`
            SELECT
                c.*,
                p.policy_no,
                pt.policy_name,
                cust.first_name || ' ' || cust.last_name AS customer_name,
                cust.mobile_no AS customer_mobile
            FROM claim c
            JOIN policy p ON c.policy_id = p.policy_id
            LEFT JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
            JOIN customer cust ON p.customer_id = cust.customer_id
            WHERE c.surveyor_id = $1
            ORDER BY c.claim_date DESC
        `, [surveyorId]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching surveyor claims:", err.message);
        res.status(500).json({ error: "Failed to fetch surveyor claims" });
    }
};

// Create surveyor
const createSurveyor = async (req, res) => {
    try {
        const { surveyor_name, phone, email, license_no, experience } = req.body;

        if (!surveyor_name) {
            return res.status(400).json({ error: "Surveyor name is required" });
        }

        const finalLicense = license_no && license_no.trim() !== ""
            ? license_no.trim()
            : `LIC-SUR-${Math.floor(100000 + Math.random() * 900000)}`;

        const result = await pool.query(
            `INSERT INTO surveyor (surveyor_name, phone, email, license_no, experience)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                surveyor_name.trim(),
                phone || null,
                email ? email.trim() : null,
                finalLicense,
                experience ? parseInt(experience, 10) : 0
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating surveyor:", err.message);
        res.status(500).json({ error: "Failed to create surveyor" });
    }
};

// Update surveyor
const updateSurveyor = async (req, res) => {
    try {
        const surveyorId = req.params.id;
        const { surveyor_name, phone, email, license_no, experience } = req.body;

        const result = await pool.query(
            `UPDATE surveyor
             SET surveyor_name = COALESCE($1, surveyor_name),
                 phone = COALESCE($2, phone),
                 email = COALESCE($3, email),
                 license_no = COALESCE($4, license_no),
                 experience = COALESCE($5, experience)
             WHERE surveyor_id = $6
             RETURNING *`,
            [
                surveyor_name ? surveyor_name.trim() : null,
                phone || null,
                email ? email.trim() : null,
                license_no ? license_no.trim() : null,
                experience !== undefined ? parseInt(experience, 10) : null,
                surveyorId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Surveyor not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating surveyor:", err.message);
        res.status(500).json({ error: "Failed to update surveyor" });
    }
};

// Delete surveyor
const deleteSurveyor = async (req, res) => {
    try {
        const surveyorId = req.params.id;

        const result = await pool.query(
            "DELETE FROM surveyor WHERE surveyor_id = $1 RETURNING *",
            [surveyorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Surveyor not found" });
        }

        res.json({ message: "Surveyor deleted successfully", surveyor: result.rows[0] });
    } catch (err) {
        console.error("Error deleting surveyor:", err.message);
        res.status(500).json({ error: "Failed to delete surveyor" });
    }
};

module.exports = {
    getSurveyors,
    getSurveyorById,
    getSurveyorClaims,
    createSurveyor,
    updateSurveyor,
    deleteSurveyor
};

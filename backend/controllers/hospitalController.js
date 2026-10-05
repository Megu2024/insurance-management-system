const pool = require("../db");

// Get all hospitals
const getHospitals = async (req, res) => {
    try {
        const { search, claim_id } = req.query;

        let query = `
            SELECT
                h.*,
                c.claim_amount,
                c.claim_status,
                p.policy_no,
                cust.first_name || ' ' || cust.last_name AS customer_name
            FROM hospital h
            LEFT JOIN claim c ON h.claim_id = c.claim_id
            LEFT JOIN policy p ON c.policy_id = p.policy_id
            LEFT JOIN customer cust ON p.customer_id = cust.customer_id
            WHERE 1=1
        `;

        const params = [];

        if (claim_id) {
            params.push(claim_id);
            query += ` AND h.claim_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (h.hospital_name ILIKE $${params.length} OR h.city ILIKE $${params.length} OR p.policy_no ILIKE $${params.length})`;
        }

        query += " ORDER BY h.hospital_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching hospitals:", err.message);
        res.status(500).json({ error: "Failed to fetch hospitals" });
    }
};

// Get single hospital by ID
const getHospitalById = async (req, res) => {
    try {
        const hospitalId = req.params.id;

        const result = await pool.query(
            `SELECT h.*, c.claim_amount, c.claim_status, p.policy_no
             FROM hospital h
             LEFT JOIN claim c ON h.claim_id = c.claim_id
             LEFT JOIN policy p ON c.policy_id = p.policy_id
             WHERE h.hospital_id = $1`,
            [hospitalId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Hospital not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching hospital:", err.message);
        res.status(500).json({ error: "Failed to fetch hospital" });
    }
};

const createHospital = async (req, res) => {
    try {
        const {
            hospital_name,
            claim_id,
            city,
            admission_date,
            discharge_date,
            bill_amt
        } = req.body;

        if (!hospital_name || !claim_id) {
            return res.status(400).json({ error: "Hospital name and claim ID are required" });
        }

        const result = await pool.query(
            `INSERT INTO hospital
                (
                    hospital_name,
                    claim_id,
                    city,
                    admission_date,
                    discharge_date,
                    bill_amt
                )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                hospital_name.trim(),
                claim_id,
                city || null,
                admission_date || null,
                discharge_date || null,
                bill_amt || 0
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating hospital:", err.message);

        res.status(500).json({
            error: "Failed to create hospital"
        });
    }
};

const updateHospital = async (req, res) => {
    try {
        const hospitalId = req.params.id;

        const {
            hospital_name,
            city,
            admission_date,
            discharge_date,
            bill_amt,
            claim_id
        } = req.body;

        const result = await pool.query(
            `UPDATE hospital
             SET
                hospital_name = COALESCE($1, hospital_name),
                city = COALESCE($2, city),
                admission_date = COALESCE($3, admission_date),
                discharge_date = COALESCE($4, discharge_date),
                bill_amt = COALESCE($5, bill_amt),
                claim_id = COALESCE($6, claim_id)
             WHERE hospital_id = $7
             RETURNING *`,
            [
                hospital_name ? hospital_name.trim() : null,
                city || null,
                admission_date || null,
                discharge_date || null,
                bill_amt !== undefined ? bill_amt : null,
                claim_id || null,
                hospitalId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Hospital not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating hospital:", err.message);

        res.status(500).json({
            error: "Failed to update hospital"
        });
    }
};

const deleteHospital = async (req, res) => {
    try {
        const hospitalId = req.params.id;

        const result = await pool.query(
            `DELETE FROM hospital
             WHERE hospital_id = $1
             RETURNING *`,
            [hospitalId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Hospital not found"
            });
        }

        res.json({
            message: "Hospital deleted successfully",
            hospital: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting hospital:", err.message);

        res.status(500).json({
            error: "Failed to delete hospital"
        });
    }
};

module.exports = {
    getHospitals,
    getHospitalById,
    createHospital,
    updateHospital,
    deleteHospital
};
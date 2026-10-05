const pool = require("../db");

// Get all businesses with linked policy and customer details
const getBusinesses = async (req, res) => {
    try {
        const { search, policy_id } = req.query;
        const user = req.user;

        let query = `
            SELECT
                b.*,
                p.policy_no,
                p.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name
            FROM business b
            JOIN policy p ON b.policy_id = p.policy_id
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
            query += ` AND b.policy_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (b.business_name ILIKE $${params.length} OR b.industry_type ILIKE $${params.length} OR b.gst_no ILIKE $${params.length} OR p.policy_no ILIKE $${params.length})`;
        }

        query += " ORDER BY b.business_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching businesses:", err.message);
        res.status(500).json({ error: "Failed to fetch businesses" });
    }
};

// Get single business by ID
const getBusinessById = async (req, res) => {
    try {
        const businessId = req.params.id;

        const result = await pool.query(
            `SELECT b.*, p.policy_no, p.customer_id, c.first_name || ' ' || c.last_name AS customer_name
             FROM business b
             JOIN policy p ON b.policy_id = p.policy_id
             JOIN customer c ON p.customer_id = c.customer_id
             WHERE b.business_id = $1`,
            [businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Business not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching business:", err.message);
        res.status(500).json({ error: "Failed to fetch business" });
    }
};

const createBusiness = async (req, res) => {
    try {
        const {
            business_name,
            industry_type,
            address,
            policy_id,
            gst_no,
            annual_turnover,
            employee_count
        } = req.body;

        if (!policy_id || !business_name) {
            return res.status(400).json({ error: "Policy ID and business name are required" });
        }

        const result = await pool.query(
            `INSERT INTO business
                (
                    business_name,
                    industry_type,
                    address,
                    policy_id,
                    gst_no,
                    annual_turnover,
                    employee_count
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                business_name.trim(),
                industry_type || null,
                address || null,
                policy_id,
                gst_no ? gst_no.trim() : null,
                annual_turnover || 0,
                employee_count ? parseInt(employee_count, 10) : 0
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating business:", err.message);

        res.status(500).json({
            error: "Failed to create business: " + err.message
        });
    }
};

const updateBusiness = async (req, res) => {
    try {
        const businessId = req.params.id;

        const {
            business_name,
            industry_type,
            address,
            gst_no,
            annual_turnover,
            employee_count,
            policy_id
        } = req.body;

        const result = await pool.query(
            `UPDATE business
             SET
                business_name = COALESCE($1, business_name),
                industry_type = COALESCE($2, industry_type),
                address = COALESCE($3, address),
                gst_no = COALESCE($4, gst_no),
                annual_turnover = COALESCE($5, annual_turnover),
                employee_count = COALESCE($6, employee_count),
                policy_id = COALESCE($7, policy_id)
             WHERE business_id = $8
             RETURNING *`,
            [
                business_name ? business_name.trim() : null,
                industry_type || null,
                address || null,
                gst_no ? gst_no.trim() : null,
                annual_turnover !== undefined ? annual_turnover : null,
                employee_count !== undefined ? (employee_count === "" ? null : parseInt(employee_count, 10)) : null,
                policy_id || null,
                businessId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Business not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating business:", err.message);

        res.status(500).json({
            error: "Failed to update business"
        });
    }
};

const deleteBusiness = async (req, res) => {
    try {
        const businessId = req.params.id;

        const result = await pool.query(
            `DELETE FROM business
             WHERE business_id = $1
             RETURNING *`,
            [businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Business not found"
            });
        }

        res.json({
            message: "Business deleted successfully",
            business: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting business:", err.message);

        res.status(500).json({
            error: "Failed to delete business"
        });
    }
};

module.exports = {
    getBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
    deleteBusiness
};
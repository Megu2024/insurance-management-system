const pool = require("../db");

const createBusiness = async (req, res) => {
    try {
        const {
            policy_id,
            business_name,
            industry_type,
            address,
            gst_no,
            annual_turnover,
            employee_count
        } = req.body;

        const result = await pool.query(
            `INSERT INTO business (
                policy_id,
                business_name,
                industry_type,
                address,
                gst_no,
                annual_turnover,
                employee_count
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                policy_id,
                business_name,
                industry_type,
                address,
                gst_no,
                annual_turnover,
                employee_count
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating business:", err.message);

        res.status(500).json({
            error: "Failed to create business"
        });
    }
};

const updateBusiness = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            business_name,
            industry_type,
            address,
            gst_no,
            annual_turnover,
            employee_count
        } = req.body;

        const result = await pool.query(
            `UPDATE business
             SET business_name = $1,
                 industry_type = $2,
                 address = $3,
                 gst_no = $4,
                 annual_turnover = $5,
                 employee_count = $6
             WHERE business_id = $7
             RETURNING *`,
            [
                business_name,
                industry_type,
                address,
                gst_no,
                annual_turnover,
                employee_count,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Business not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error("Error updating business:", err.message);

        res.status(500).json({
            error: "Failed to update business"
        });
    }
};


const deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM business
             WHERE business_id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Business not found"
            });
        }

        res.status(200).json({
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
    createBusiness,
    updateBusiness,
    deleteBusiness
};
const pool = require("../db");

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
                hospital_name,
                claim_id,
                city,
                admission_date,
                discharge_date,
                bill_amt
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
            claim_id,
            city,
            admission_date,
            discharge_date,
            bill_amt
        } = req.body;

        const result = await pool.query(
            `UPDATE hospital
             SET
                hospital_name = $1,
                claim_id = $2,
                city = $3,
                admission_date = $4,
                discharge_date = $5,
                bill_amt = $6
             WHERE hospital_id = $7
             RETURNING *`,
            [
                hospital_name,
                claim_id,
                city,
                admission_date,
                discharge_date,
                bill_amt,
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
    createHospital,
    updateHospital,
    deleteHospital
};
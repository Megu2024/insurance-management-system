const pool = require("../db");

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
                claim_date,
                claim_amount,
                claim_status,
                description,
                surveyor_id,
                approve_amt
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating claim:", err.message);

        res.status(500).json({
            error: "Failed to create claim"
        });
    }
};

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
                claim_date = $1,
                claim_amount = $2,
                claim_status = $3,
                description = $4,
                surveyor_id = $5,
                approve_amt = $6
             WHERE claim_id = $7
             RETURNING *`,
            [
                claim_date,
                claim_amount,
                claim_status,
                description,
                surveyor_id,
                approve_amt,
                claimId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Claim not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating claim:", err.message);

        res.status(500).json({
            error: "Failed to update claim"
        });
    }
};

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
            return res.status(404).json({
                error: "Claim not found"
            });
        }

        res.json({
            message: "Claim deleted successfully",
            claim: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting claim:", err.message);

        res.status(500).json({
            error: "Failed to delete claim"
        });
    }
};

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

        res.status(500).json({
            error: "Failed to fetch claim hospital"
        });
    }
};

module.exports = {
    createClaim,
    updateClaim,
    deleteClaim,
    getClaimHospital
};
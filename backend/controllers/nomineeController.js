const pool = require("../db");

const createNominee = async (req, res) => {
    try {
        const {
            policy_id,
            nominee_name,
            relationship,
            dob,
            mobile_no
        } = req.body;

        const result = await pool.query(
            `INSERT INTO nominee
                (
                    policy_id,
                    nominee_name,
                    relationship,
                    dob,
                    mobile_no
                )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                policy_id,
                nominee_name,
                relationship,
                dob,
                mobile_no
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
            mobile_no
        } = req.body;

        const result = await pool.query(
            `UPDATE nominee
             SET
                nominee_name = $1,
                relationship = $2,
                dob = $3,
                mobile_no = $4
             WHERE nominee_id = $5
             RETURNING *`,
            [
                nominee_name,
                relationship,
                dob,
                mobile_no,
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
    createNominee,
    updateNominee,
    deleteNominee
};
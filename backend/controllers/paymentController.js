const pool = require("../db");

const createPayment = async (req, res) => {
    try {
        const {
            policy_id,
            payment_date,
            amount,
            payment_status,
            payment_mode
        } = req.body;

        const result = await pool.query(
            `INSERT INTO premium_payment
                (policy_id, payment_date, amount, payment_status, payment_mode)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                policy_id,
                payment_date,
                amount,
                payment_status,
                payment_mode
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating payment:", err.message);

        res.status(500).json({
            error: "Failed to create payment"
        });
    }
};

const updatePayment = async (req, res) => {
    try {
        const paymentId = req.params.id;

        const {
            payment_date,
            amount,
            payment_status,
            payment_mode
        } = req.body;

        const result = await pool.query(
            `UPDATE premium_payment
             SET
                payment_date = $1,
                amount = $2,
                payment_status = $3,
                payment_mode = $4
             WHERE payment_id = $5
             RETURNING *`,
            [
                payment_date,
                amount,
                payment_status,
                payment_mode,
                paymentId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Payment not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating payment:", err.message);

        res.status(500).json({
            error: "Failed to update payment"
        });
    }
};

const deletePayment = async (req, res) => {
    try {
        const paymentId = req.params.id;

        const result = await pool.query(
            `DELETE FROM premium_payment
             WHERE payment_id = $1
             RETURNING *`,
            [paymentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Payment not found"
            });
        }

        res.json({
            message: "Payment deleted successfully",
            payment: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting payment:", err.message);

        res.status(500).json({
            error: "Failed to delete payment"
        });
    }
};


module.exports = {
    createPayment,
    updatePayment,
    deletePayment
};
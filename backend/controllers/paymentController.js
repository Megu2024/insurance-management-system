const pool = require("../db");

// Get all payments with linked policy & customer details
const getPayments = async (req, res) => {
    try {
        const { status, policy_id, search } = req.query;
        const user = req.user;

        let query = `
            SELECT
                py.payment_id,
                py.policy_id,
                py.payment_date,
                py.amount,
                py.payment_status,
                py.payment_mode,

                p.policy_no,
                p.premium_amt,
                p.payment_freq,
                p.customer_id,

                c.first_name || ' ' || c.last_name AS customer_name,
                c.email AS customer_email,
                c.mobile_no AS customer_mobile

            FROM premium_payment py
            INNER JOIN policy p ON py.policy_id = p.policy_id
            INNER JOIN customer c ON p.customer_id = c.customer_id
            WHERE 1=1
        `;

        const params = [];

        // Role-based filtering
        if (user && user.role === "CUSTOMER" && user.customer_id) {
            params.push(user.customer_id);
            query += ` AND p.customer_id = $${params.length}`;
        } else if (user && user.role === "AGENT" && user.agent_id) {
            params.push(user.agent_id);
            query += ` AND p.agent_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND LOWER(py.payment_status) = LOWER($${params.length})`;
        }

        if (policy_id) {
            params.push(policy_id);
            query += ` AND py.policy_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (p.policy_no ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR py.payment_mode ILIKE $${params.length})`;
        }

        query += " ORDER BY py.payment_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching payments:", err.message);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
    try {
        const paymentId = req.params.id;

        const result = await pool.query(
            `SELECT
                py.*,
                p.policy_no,
                p.premium_amt,
                p.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name,
                c.email AS customer_email
             FROM premium_payment py
             INNER JOIN policy p ON py.policy_id = p.policy_id
             INNER JOIN customer c ON p.customer_id = c.customer_id
             WHERE py.payment_id = $1`,
            [paymentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching payment:", err.message);
        res.status(500).json({ error: "Failed to fetch payment" });
    }
};

// Create payment
const createPayment = async (req, res) => {
    try {
        const {
            policy_id,
            payment_date,
            amount,
            payment_status,
            payment_mode
        } = req.body;

        if (!policy_id || !amount) {
            return res.status(400).json({ error: "Policy ID and amount are required" });
        }

        const result = await pool.query(
            `INSERT INTO premium_payment
                (policy_id, payment_date, amount, payment_status, payment_mode)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                policy_id,
                payment_date || new Date().toISOString().split("T")[0],
                amount,
                payment_status || "Successful",
                payment_mode || "Online"
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating payment:", err.message);
        res.status(500).json({ error: "Failed to create payment" });
    }
};

// Update payment
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
                payment_date = COALESCE($1, payment_date),
                amount = COALESCE($2, amount),
                payment_status = COALESCE($3, payment_status),
                payment_mode = COALESCE($4, payment_mode)
             WHERE payment_id = $5
             RETURNING *`,
            [
                payment_date || null,
                amount !== undefined ? amount : null,
                payment_status || null,
                payment_mode || null,
                paymentId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating payment:", err.message);
        res.status(500).json({ error: "Failed to update payment" });
    }
};

// Delete payment
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
            return res.status(404).json({ error: "Payment not found" });
        }

        res.json({
            message: "Payment deleted successfully",
            payment: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting payment:", err.message);
        res.status(500).json({ error: "Failed to delete payment" });
    }
};

module.exports = {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
};
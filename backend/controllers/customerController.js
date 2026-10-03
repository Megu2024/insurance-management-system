const pool = require("../db");
const getCustomers = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM customer ORDER BY customer_id"
        );
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error fetching customers:", err.message);

        res.status(500).json({
            error: "Failed to fetch customers"
        });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            "SELECT * FROM customer WHERE customer_id = $1",
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.log("Error fetching customer:", err.message);

        res.status(500).json({
            error: "Failed to fetch customer"
        });
    }
};

const getCustomerPolicies = async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            `SELECT
                p.policy_id,
                p.policy_no,
                p.start_date,
                p.end_date,
                p.premium_amt,
                p.sum_coverage,
                p.policy_status,
                p.payment_freq,
                pt.policy_name,
                pt.category
             FROM policy p
             INNER JOIN policy_type pt
                ON p.policy_type_id = pt.policy_type_id
             WHERE p.customer_id = $1
             ORDER BY p.policy_id`,
            [customerId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching customer policies:", err.message);

        res.status(500).json({
            error: "Failed to fetch policies"
        });
    }
};

const getCustomerDocuments = async (req, res) => {
    try {
        const customerId = req.params.id;

        // Check whether the customer exists
        const customerResult = await pool.query(
            `SELECT customer_id, first_name, last_name
             FROM customer
             WHERE customer_id = $1`,
            [customerId]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        // Get documents belonging to the customer
        const result = await pool.query(
            `SELECT
                document_id,
                customer_id,
                doc_type,
                doc_no,
                verification_status
             FROM document
             WHERE customer_id = $1
             ORDER BY document_id`,
            [customerId]
        );

        res.json({
            customer_id: customerResult.rows[0].customer_id,
            customer_name:
                customerResult.rows[0].first_name +
                " " +
                customerResult.rows[0].last_name,
            documents: result.rows
        });

    } catch (err) {
        console.error("Error fetching documents:", err.message);

        res.status(500).json({
            error: "Failed to fetch documents"
        });
    }
};

const createCustomer = async (req, res) => {
    try {
        const {
            aadhaar_no,
            pan_no,
            dob,
            gender,
            mobile_no,
            email,
            address,
            first_name,
            last_name,
            city,
            state,
            pincode,
            occupation,
            annual_income,
            customer_status
        } = req.body;

        const result = await pool.query(
            `INSERT INTO customer (
                aadhaar_no,
                pan_no,
                dob,
                gender,
                mobile_no,
                email,
                address,
                first_name,
                last_name,
                city,
                state,
                pincode,
                occupation,
                annual_income,
                customer_status
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15
            )
            RETURNING *`,
            [
                aadhaar_no,
                pan_no,
                dob,
                gender,
                mobile_no,
                email,
                address,
                first_name,
                last_name,
                city,
                state,
                pincode,
                occupation,
                annual_income,
                customer_status
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating customer:", err.message);

        res.status(500).json({
            error: "Failed to create customer"
        });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;

        const {
            mobile_no,
            email,
            address,
            occupation,
            annual_income,
            customer_status
        } = req.body;

        const result = await pool.query(
            `UPDATE customer
             SET mobile_no = $1,
                 email = $2,
                 address = $3,
                 occupation = $4,
                 annual_income = $5,
                 customer_status = $6
             WHERE customer_id = $7
             RETURNING *`,
            [
                mobile_no,
                email,
                address,
                occupation,
                annual_income,
                customer_status,
                customerId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating customer:", err.message);

        res.status(500).json({
            error: "Failed to update customer"
        });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            `DELETE FROM customer
             WHERE customer_id = $1
             RETURNING *`,
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        res.json({
            message: "Customer deleted successfully",
            customer: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting customer:", err.message);

        res.status(500).json({
            error: "Failed to delete customer"
        });
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    getCustomerPolicies,
    getCustomerDocuments,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
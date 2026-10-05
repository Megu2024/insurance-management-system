const pool = require("../db");

// Get all customers (with search & filtering)
const getCustomers = async (req, res) => {
    try {
        const { search, city, status } = req.query;
        const user = req.user;

        // If customer role, only return self
        if (user && user.role === "CUSTOMER" && user.customer_id) {
            const result = await pool.query(
                "SELECT * FROM customer WHERE customer_id = $1",
                [user.customer_id]
            );
            return res.json(result.rows);
        }

        let query = "SELECT * FROM customer WHERE 1=1";
        const params = [];

        // If agent role, return customers who have policies handled by this agent
        if (user && user.role === "AGENT" && user.agent_id) {
            params.push(user.agent_id);
            query += ` AND customer_id IN (SELECT customer_id FROM policy WHERE agent_id = $${params.length})`;
        }

        if (status) {
            params.push(status);
            query += ` AND LOWER(customer_status) = LOWER($${params.length})`;
        }

        if (city) {
            params.push(`%${city}%`);
            query += ` AND city ILIKE $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length} OR mobile_no ILIKE $${params.length} OR city ILIKE $${params.length})`;
        }

        query += " ORDER BY customer_id ASC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error fetching customers:", err.message);

        res.status(500).json({
            error: "Failed to fetch customers"
        });
    }
};

// Get single customer by ID
const getCustomerById = async (req, res) => {
    try {
        const customerId = req.params.id;
        const user = req.user;

        // Customer can only view their own profile
        if (user && user.role === "CUSTOMER" && user.customer_id && parseInt(customerId, 10) !== user.customer_id) {
            return res.status(403).json({ error: "Access denied. You can only view your own profile." });
        }

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

// Get customer's policies
const getCustomerPolicies = async (req, res) => {
    try {
        const customerId = req.params.id;
        const user = req.user;

        if (user && user.role === "CUSTOMER" && user.customer_id && parseInt(customerId, 10) !== user.customer_id) {
            return res.status(403).json({ error: "Access denied. You can only view your own policies." });
        }

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

// Get customer's documents
const getCustomerDocuments = async (req, res) => {
    try {
        const customerId = req.params.id;
        const user = req.user;

        if (user && user.role === "CUSTOMER" && user.customer_id && parseInt(customerId, 10) !== user.customer_id) {
            return res.status(403).json({ error: "Access denied. You can only view your own documents." });
        }

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
                verification_status,
                file_name,
                file_type,
                file_size,
                uploaded_at,
                (CASE WHEN file_data IS NOT NULL AND LENGTH(file_data) > 0 THEN true ELSE false END) AS has_file
             FROM document
             WHERE customer_id = $1
             ORDER BY document_id DESC`,
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

// Create customer (Admin / Direct)
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

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: "First name, last name, and email are required" });
        }

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
                aadhaar_no || null,
                pan_no || null,
                dob || null,
                gender || null,
                mobile_no || null,
                email.trim(),
                address || null,
                first_name.trim(),
                last_name.trim(),
                city || null,
                state || null,
                pincode || null,
                occupation || null,
                annual_income ? parseFloat(annual_income) : 0,
                customer_status || "ACTIVE"
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating customer:", err.message);

        res.status(500).json({
            error: "Failed to create customer: " + err.message
        });
    }
};

// Update customer
const updateCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;
        const user = req.user;

        if (user && user.role === "CUSTOMER" && user.customer_id && parseInt(customerId, 10) !== user.customer_id) {
            return res.status(403).json({ error: "Access denied. You can only update your own profile." });
        }

        const {
            first_name,
            last_name,
            mobile_no,
            email,
            address,
            city,
            state,
            pincode,
            occupation,
            annual_income,
            customer_status
        } = req.body;

        const result = await pool.query(
            `UPDATE customer
             SET first_name = COALESCE($1, first_name),
                 last_name = COALESCE($2, last_name),
                 mobile_no = COALESCE($3, mobile_no),
                 email = COALESCE($4, email),
                 address = COALESCE($5, address),
                 city = COALESCE($6, city),
                 state = COALESCE($7, state),
                 pincode = COALESCE($8, pincode),
                 occupation = COALESCE($9, occupation),
                 annual_income = COALESCE($10, annual_income),
                 customer_status = COALESCE($11, customer_status)
             WHERE customer_id = $12
             RETURNING *`,
            [
                first_name ? first_name.trim() : null,
                last_name ? last_name.trim() : null,
                mobile_no || null,
                email ? email.trim() : null,
                address || null,
                city || null,
                state || null,
                pincode || null,
                occupation || null,
                annual_income !== undefined && annual_income !== null && annual_income !== "" && !isNaN(parseFloat(annual_income))
                    ? parseFloat(annual_income)
                    : (annual_income === 0 ? 0 : null),
                customer_status || null,
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

// Delete or Force Purge customer (Admin only)
const deleteCustomer = async (req, res) => {
    const customerId = req.params.id;
    const force = req.query.force === "true" || req.body?.force === true;
    const preserveLogin = req.query.preserveLogin === "true" || req.body?.preserveLogin === true;

    try {
        // 1. Check if customer exists
        const custCheck = await pool.query(
            "SELECT customer_id, first_name, last_name, email FROM customer WHERE customer_id = $1",
            [customerId]
        );

        if (custCheck.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const customer = custCheck.rows[0];

        // 2. Check existing policies
        const policyCheck = await pool.query(
            "SELECT policy_id, policy_no FROM policy WHERE customer_id = $1",
            [customerId]
        );

        const policyCount = policyCheck.rows.length;

        // If customer has policies and force is NOT set, warn and block
        if (policyCount > 0 && !force) {
            const policyNos = policyCheck.rows.map(p => p.policy_no).join(", ");
            return res.status(409).json({
                error: `Cannot delete ${customer.first_name} ${customer.last_name}: Customer has ${policyCount} linked policy record(s) (${policyNos}). In DBMS rules, active policies cannot be orphaned. Use Force Purge to remove all associated records.`,
                hasPolicies: true,
                policyCount
            });
        }

        // 3. Perform Transactional Deletion / Purge
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const policyIds = policyCheck.rows.map(r => r.policy_id);

            if (policyIds.length > 0) {
                // Find all claim IDs under these policies
                const claimsRes = await client.query(
                    "SELECT claim_id FROM claim WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );
                const claimIds = claimsRes.rows.map(r => r.claim_id);

                // Delete hospital records for claims
                if (claimIds.length > 0) {
                    await client.query(
                        "DELETE FROM hospital WHERE claim_id = ANY($1::int[])",
                        [claimIds]
                    );
                }

                // Delete claims
                await client.query(
                    "DELETE FROM claim WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );

                // Delete premium payments
                await client.query(
                    "DELETE FROM premium_payment WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );

                // Delete nominees
                await client.query(
                    "DELETE FROM nominee WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );

                // Delete insured assets (1:1 with policies)
                await client.query(
                    "DELETE FROM vehicle WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );
                await client.query(
                    "DELETE FROM property WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );
                await client.query(
                    "DELETE FROM business WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );

                // Delete policy audit triggers
                await client.query(
                    "DELETE FROM policy_status_audit WHERE policy_id = ANY($1::int[])",
                    [policyIds]
                );

                // Delete the policies themselves
                await client.query(
                    "DELETE FROM policy WHERE customer_id = $1",
                    [customerId]
                );
            }

            // Delete customer documents
            await client.query(
                "DELETE FROM document WHERE customer_id = $1",
                [customerId]
            );

            if (preserveLogin) {
                // Keep customer profile and user credentials intact
                await client.query(
                    "UPDATE customer SET customer_status = 'Active' WHERE customer_id = $1",
                    [customerId]
                );
                await client.query(
                    "UPDATE users SET status = 'APPROVED' WHERE customer_id = $1",
                    [customerId]
                );

                await client.query("COMMIT");
                return res.json({
                    message: `All records (policies, payments, claims, nominees, assets, documents) for ${customer.first_name} ${customer.last_name} were forcefully deleted. Customer login credentials remain active.`,
                    purgedPolicies: policyIds.length,
                    customerRetained: true
                });
            } else {
                // Delete user account & customer record completely
                await client.query("DELETE FROM users WHERE customer_id = $1", [customerId]);
                const delRes = await client.query(
                    "DELETE FROM customer WHERE customer_id = $1 RETURNING *",
                    [customerId]
                );

                await client.query("COMMIT");
                return res.json({
                    message: `Customer ${customer.first_name} ${customer.last_name} and all associated records were completely deleted.`,
                    customer: delRes.rows[0],
                    customerRetained: false
                });
            }
        } catch (txErr) {
            await client.query("ROLLBACK");
            throw txErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Error in deleteCustomer:", err.message);

        if (err.code === "23503") {
            return res.status(409).json({
                error: "Cannot delete customer because dependent relational records exist. Please select Force Delete to purge all linked data."
            });
        }

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
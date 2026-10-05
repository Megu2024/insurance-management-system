const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "insurance_management_jwt_secret_key_2026_super_secure";

// Helper to sign JWT
const generateToken = (user, name = null) => {
    return jwt.sign(
        {
            userId: user.user_id,
            email: user.email,
            role: user.role,
            status: user.status,
            customer_id: user.customer_id,
            agent_id: user.agent_id,
            surveyor_id: user.surveyor_id,
            name: name || user.username
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)",
            [email.trim()]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email/username or password" });
        }

        const user = userResult.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email/username or password" });
        }

        // Check account approval status
        if (user.status === "PENDING") {
            return res.status(403).json({
                error: "Your application is currently pending admin approval. You can log in once an administrator approves your account.",
                status: "PENDING"
            });
        }

        if (user.status === "REJECTED") {
            return res.status(403).json({
                error: "Your account registration has been rejected or deactivated. Please contact the administrator.",
                status: "REJECTED"
            });
        }

        // Get full name from linked entity
        let displayName = user.username;
        if (user.role === "CUSTOMER" && user.customer_id) {
            const cRes = await pool.query(
                "SELECT first_name, last_name FROM customer WHERE customer_id = $1",
                [user.customer_id]
            );
            if (cRes.rows.length > 0) {
                displayName = `${cRes.rows[0].first_name} ${cRes.rows[0].last_name}`.trim();
            }
        } else if (user.role === "AGENT" && user.agent_id) {
            const aRes = await pool.query(
                "SELECT agent_name FROM agent WHERE agent_id = $1",
                [user.agent_id]
            );
            if (aRes.rows.length > 0) {
                displayName = aRes.rows[0].agent_name;
            }
        } else if (user.role === "SURVEYOR" && user.surveyor_id) {
            const sRes = await pool.query(
                "SELECT surveyor_name FROM surveyor WHERE surveyor_id = $1",
                [user.surveyor_id]
            );
            if (sRes.rows.length > 0) {
                displayName = sRes.rows[0].surveyor_name;
            }
        } else if (user.role === "ADMIN") {
            displayName = "System Administrator";
        }

        const token = generateToken(user, displayName);

        res.json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                customer_id: user.customer_id,
                agent_id: user.agent_id,
                surveyor_id: user.surveyor_id,
                name: displayName
            }
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Failed to log in" });
    }
};

// REGISTER CUSTOMER (Direct approval)
const registerCustomer = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            mobile_no,
            aadhaar_no,
            pan_no,
            dob,
            gender,
            address,
            city,
            state,
            pincode,
            occupation,
            annual_income
        } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                error: "First name, last name, email, and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await client.query(
            "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)",
            [email.trim()]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "A user with this email already exists" });
        }

        await client.query("BEGIN");

        // Create customer record
        const custResult = await client.query(
            `INSERT INTO customer (
                aadhaar_no, pan_no, dob, gender, mobile_no, email,
                address, first_name, last_name, city, state, pincode,
                occupation, annual_income, customer_status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'ACTIVE')
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
                annual_income ? parseFloat(annual_income) : 0
            ]
        );

        const newCustomer = custResult.rows[0];

        // Hash password and create user record
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, status, customer_id)
             VALUES ($1, $2, $3, 'CUSTOMER', 'APPROVED', $4)
             RETURNING user_id, username, email, role, status, customer_id`,
            [email.trim(), email.trim(), hash, newCustomer.customer_id]
        );

        await client.query("COMMIT");

        const user = userResult.rows[0];
        const displayName = `${newCustomer.first_name} ${newCustomer.last_name}`.trim();
        const token = generateToken(user, displayName);

        res.status(201).json({
            message: "Customer registered successfully",
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                customer_id: user.customer_id,
                name: displayName
            },
            customer: newCustomer
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error registering customer:", err.message);
        res.status(500).json({ error: "Failed to register customer: " + err.message });
    } finally {
        client.release();
    }
};

// REGISTER AGENT (Requires Admin Approval - Status PENDING)
const registerAgent = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            email,
            password,
            agent_name,
            mobile_no,
            license_no,
            branch_id
        } = req.body;

        if (!email || !password || !agent_name) {
            return res.status(400).json({
                error: "Agent name, email, and password are required"
            });
        }

        const existingUser = await client.query(
            "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)",
            [email.trim()]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "A user with this email already exists" });
        }

        await client.query("BEGIN");

        // Create agent record
        const agentResult = await client.query(
            `INSERT INTO agent (branch_id, agent_name, mobile_no, email, license_no)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                branch_id ? parseInt(branch_id, 10) : null,
                agent_name.trim(),
                mobile_no || null,
                email.trim(),
                license_no || null
            ]
        );

        const newAgent = agentResult.rows[0];

        // Hash password and create user record with PENDING status
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, status, agent_id)
             VALUES ($1, $2, $3, 'AGENT', 'PENDING', $4)
             RETURNING user_id, username, email, role, status, agent_id`,
            [email.trim(), email.trim(), hash, newAgent.agent_id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Agent application submitted successfully. Your account is pending admin approval.",
            status: "PENDING",
            user: userResult.rows[0],
            agent: newAgent
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error registering agent:", err.message);
        res.status(500).json({ error: "Failed to submit agent application: " + err.message });
    } finally {
        client.release();
    }
};

// REGISTER SURVEYOR (Requires Admin Approval - Status PENDING)
const registerSurveyor = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            email,
            password,
            surveyor_name,
            phone,
            license_no,
            experience
        } = req.body;

        if (!email || !password || !surveyor_name) {
            return res.status(400).json({
                error: "Surveyor name, email, and password are required"
            });
        }

        const existingUser = await client.query(
            "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)",
            [email.trim()]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "A user with this email already exists" });
        }

        await client.query("BEGIN");

        // Create surveyor record
        const surveyorResult = await client.query(
            `INSERT INTO surveyor (surveyor_name, phone, email, license_no, experience)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                surveyor_name.trim(),
                phone || null,
                email.trim(),
                license_no || null,
                experience ? parseInt(experience, 10) : 0
            ]
        );

        const newSurveyor = surveyorResult.rows[0];

        // Hash password and create user record with PENDING status
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, status, surveyor_id)
             VALUES ($1, $2, $3, 'SURVEYOR', 'PENDING', $4)
             RETURNING user_id, username, email, role, status, surveyor_id`,
            [email.trim(), email.trim(), hash, newSurveyor.surveyor_id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Surveyor application submitted successfully. Your account is pending admin approval.",
            status: "PENDING",
            user: userResult.rows[0],
            surveyor: newSurveyor
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error registering surveyor:", err.message);
        res.status(500).json({ error: "Failed to submit surveyor application: " + err.message });
    } finally {
        client.release();
    }
};

// GET CURRENT USER PROFILE
const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;

        const userRes = await pool.query(
            "SELECT user_id, username, email, role, status, customer_id, agent_id, surveyor_id, created_at FROM users WHERE user_id = $1",
            [userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userRes.rows[0];
        let details = null;

        if (user.role === "CUSTOMER" && user.customer_id) {
            const cRes = await pool.query("SELECT * FROM customer WHERE customer_id = $1", [user.customer_id]);
            details = cRes.rows[0] || null;
        } else if (user.role === "AGENT" && user.agent_id) {
            const aRes = await pool.query(
                `SELECT a.*, b.branch_name_1, b.city as branch_city
                 FROM agent a LEFT JOIN branch b ON a.branch_id = b.branch_id
                 WHERE a.agent_id = $1`,
                [user.agent_id]
            );
            details = aRes.rows[0] || null;
        } else if (user.role === "SURVEYOR" && user.surveyor_id) {
            const sRes = await pool.query("SELECT * FROM surveyor WHERE surveyor_id = $1", [user.surveyor_id]);
            details = sRes.rows[0] || null;
        }

        let displayName = user.username;
        if (user.role === "CUSTOMER" && details) {
            displayName = `${details.first_name || ""} ${details.last_name || ""}`.trim() || user.username;
        } else if (user.role === "AGENT" && details) {
            displayName = details.agent_name || user.username;
        } else if (user.role === "SURVEYOR" && details) {
            displayName = details.surveyor_name || user.username;
        } else if (user.role === "ADMIN") {
            displayName = "System Administrator";
        }

        res.json({
            user: {
                ...user,
                name: displayName
            },
            details
        });
    } catch (err) {
        console.error("Error fetching current user:", err.message);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }

        const userRes = await pool.query("SELECT password_hash FROM users WHERE user_id = $1", [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await pool.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [hash, userId]);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Error changing password:", err.message);
        res.status(500).json({ error: "Failed to change password" });
    }
};

module.exports = {
    login,
    registerCustomer,
    registerAgent,
    registerSurveyor,
    getMe,
    changePassword
};

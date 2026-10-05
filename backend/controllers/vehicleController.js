const pool = require("../db");

// Get all vehicles with linked policy and customer details
const getVehicles = async (req, res) => {
    try {
        const { search, policy_id } = req.query;
        const user = req.user;

        let query = `
            SELECT
                v.*,
                p.policy_no,
                p.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name
            FROM vehicle v
            JOIN policy p ON v.policy_id = p.policy_id
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
            query += ` AND v.policy_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (v.reg_no ILIKE $${params.length} OR v.model ILIKE $${params.length} OR v.manufacturer ILIKE $${params.length} OR p.policy_no ILIKE $${params.length})`;
        }

        query += " ORDER BY v.vehicle_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching vehicles:", err.message);
        res.status(500).json({ error: "Failed to fetch vehicles" });
    }
};

// Get single vehicle by ID
const getVehicleById = async (req, res) => {
    try {
        const vehicleId = req.params.id;

        const result = await pool.query(
            `SELECT v.*, p.policy_no, p.customer_id, c.first_name || ' ' || c.last_name AS customer_name
             FROM vehicle v
             JOIN policy p ON v.policy_id = p.policy_id
             JOIN customer c ON p.customer_id = c.customer_id
             WHERE v.vehicle_id = $1`,
            [vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching vehicle:", err.message);
        res.status(500).json({ error: "Failed to fetch vehicle" });
    }
};

const createVehicle = async (req, res) => {
    try {
        const {
            policy_id,
            reg_no,
            manufacturer,
            model,
            engine_no
        } = req.body;

        if (!policy_id || !reg_no) {
            return res.status(400).json({ error: "Policy ID and registration number are required" });
        }

        const result = await pool.query(
            `INSERT INTO vehicle
                (policy_id, reg_no, manufacturer, model, engine_no)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                policy_id,
                reg_no.trim(),
                manufacturer || null,
                model || null,
                engine_no || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating vehicle:", err.message);

        res.status(500).json({
            error: "Failed to create vehicle: " + err.message
        });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;

        const {
            reg_no,
            manufacturer,
            model,
            engine_no,
            policy_id
        } = req.body;

        const result = await pool.query(
            `UPDATE vehicle
             SET
                reg_no = COALESCE($1, reg_no),
                manufacturer = COALESCE($2, manufacturer),
                model = COALESCE($3, model),
                engine_no = COALESCE($4, engine_no),
                policy_id = COALESCE($5, policy_id)
             WHERE vehicle_id = $6
             RETURNING *`,
            [
                reg_no ? reg_no.trim() : null,
                manufacturer || null,
                model || null,
                engine_no || null,
                policy_id || null,
                vehicleId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Vehicle not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating vehicle:", err.message);

        res.status(500).json({
            error: "Failed to update vehicle"
        });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;

        const result = await pool.query(
            `DELETE FROM vehicle
             WHERE vehicle_id = $1
             RETURNING *`,
            [vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Vehicle not found"
            });
        }

        res.json({
            message: "Vehicle deleted successfully",
            vehicle: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting vehicle:", err.message);

        res.status(500).json({
            error: "Failed to delete vehicle"
        });
    }
};

module.exports = {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle
};
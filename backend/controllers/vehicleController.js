const pool = require("../db");

const createVehicle = async (req, res) => {
    try {
        const {
            policy_id,
            reg_no,
            manufacturer,
            model,
            engine_no
        } = req.body;

        const result = await pool.query(
            `INSERT INTO vehicle (
                policy_id,
                reg_no,
                manufacturer,
                model,
                engine_no
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                policy_id,
                reg_no,
                manufacturer,
                model,
                engine_no
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating vehicle:", err.message);

        res.status(500).json({
            error: "Failed to create vehicle"
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
            engine_no
        } = req.body;

        const result = await pool.query(
            `UPDATE vehicle
             SET reg_no = $1,
                 manufacturer = $2,
                 model = $3,
                 engine_no = $4
             WHERE vehicle_id = $5
             RETURNING *`,
            [
                reg_no,
                manufacturer,
                model,
                engine_no,
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
    createVehicle,
    updateVehicle,
    deleteVehicle
};
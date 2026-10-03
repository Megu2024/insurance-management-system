const pool = require("../db");

const createProperty = async (req, res) => {
    try {
        const {
            policy_id,
            property_type,
            address,
            city,
            state,
            construction_year,
            market_value,
            usage_type
        } = req.body;

        const result = await pool.query(
            `INSERT INTO property (
                policy_id,
                property_type,
                address,
                city,
                state,
                construction_year,
                market_value,
                usage_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                policy_id,
                property_type,
                address,
                city,
                state,
                construction_year,
                market_value,
                usage_type
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating property:", err.message);

        res.status(500).json({
            error: "Failed to create property"
        });
    }
};

const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            property_type,
            address,
            city,
            state,
            construction_year,
            market_value,
            usage_type
        } = req.body;

        const result = await pool.query(
            `UPDATE property
             SET property_type = $1,
                 address = $2,
                 city = $3,
                 state = $4,
                 construction_year = $5,
                 market_value = $6,
                 usage_type = $7
             WHERE property_id = $8
             RETURNING *`,
            [
                property_type,
                address,
                city,
                state,
                construction_year,
                market_value,
                usage_type,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Property not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error("Error updating property:", err.message);

        res.status(500).json({
            error: "Failed to update property"
        });
    }
};

const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM property
             WHERE property_id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Property not found"
            });
        }

        res.status(200).json({
            message: "Property deleted successfully",
            property: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting property:", err.message);

        res.status(500).json({
            error: "Failed to delete property"
        });
    }
};

module.exports = {
    createProperty,
    updateProperty,
    deleteProperty
};
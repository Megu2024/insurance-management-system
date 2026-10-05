const pool = require("../db");

// Get all properties with linked policy and customer details
const getProperties = async (req, res) => {
    try {
        const { search, policy_id } = req.query;
        const user = req.user;

        let query = `
            SELECT
                pr.*,
                p.policy_no,
                p.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name
            FROM property pr
            JOIN policy p ON pr.policy_id = p.policy_id
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
            query += ` AND pr.policy_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (pr.property_type ILIKE $${params.length} OR pr.city ILIKE $${params.length} OR pr.address ILIKE $${params.length} OR p.policy_no ILIKE $${params.length})`;
        }

        query += " ORDER BY pr.property_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching properties:", err.message);
        res.status(500).json({ error: "Failed to fetch properties" });
    }
};

// Get single property by ID
const getPropertyById = async (req, res) => {
    try {
        const propertyId = req.params.id;

        const result = await pool.query(
            `SELECT pr.*, p.policy_no, p.customer_id, c.first_name || ' ' || c.last_name AS customer_name
             FROM property pr
             JOIN policy p ON pr.policy_id = p.policy_id
             JOIN customer c ON p.customer_id = c.customer_id
             WHERE pr.property_id = $1`,
            [propertyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Property not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching property:", err.message);
        res.status(500).json({ error: "Failed to fetch property" });
    }
};

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

        if (!policy_id || !property_type) {
            return res.status(400).json({ error: "Policy ID and property type are required" });
        }

        const result = await pool.query(
            `INSERT INTO property
                (
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
                property_type.trim(),
                address || null,
                city || null,
                state || null,
                construction_year ? parseInt(construction_year, 10) : null,
                market_value || 0,
                usage_type || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating property:", err.message);

        res.status(500).json({
            error: "Failed to create property: " + err.message
        });
    }
};

const updateProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;

        const {
            property_type,
            address,
            city,
            state,
            construction_year,
            market_value,
            usage_type,
            policy_id
        } = req.body;

        const result = await pool.query(
            `UPDATE property
             SET
                property_type = COALESCE($1, property_type),
                address = COALESCE($2, address),
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                construction_year = COALESCE($5, construction_year),
                market_value = COALESCE($6, market_value),
                usage_type = COALESCE($7, usage_type),
                policy_id = COALESCE($8, policy_id)
             WHERE property_id = $9
             RETURNING *`,
            [
                property_type ? property_type.trim() : null,
                address || null,
                city || null,
                state || null,
                construction_year !== undefined ? (construction_year === "" ? null : parseInt(construction_year, 10)) : null,
                market_value !== undefined ? market_value : null,
                usage_type || null,
                policy_id || null,
                propertyId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Property not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating property:", err.message);

        res.status(500).json({
            error: "Failed to update property"
        });
    }
};

const deleteProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;

        const result = await pool.query(
            `DELETE FROM property
             WHERE property_id = $1
             RETURNING *`,
            [propertyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Property not found"
            });
        }

        res.json({
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
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
};
const pool = require("../db");

// Get all documents with customer details
const getDocuments = async (req, res) => {
    try {
        const { search, customer_id, status, include_data } = req.query;
        const user = req.user;

        const fileDataCol = include_data === "true" ? "d.file_data," : "";

        let query = `
            SELECT
                d.document_id,
                d.customer_id,
                d.doc_type,
                d.doc_no,
                d.verification_status,
                d.file_name,
                d.file_type,
                d.file_size,
                d.uploaded_at,
                ${fileDataCol}
                (CASE WHEN d.file_data IS NOT NULL AND LENGTH(d.file_data) > 0 THEN true ELSE false END) AS has_file,
                c.first_name || ' ' || c.last_name AS customer_name,
                c.email AS customer_email,
                c.mobile_no AS customer_mobile
            FROM document d
            JOIN customer c ON d.customer_id = c.customer_id
            WHERE 1=1
        `;

        const params = [];

        if (user && user.role === "CUSTOMER" && user.customer_id) {
            params.push(user.customer_id);
            query += ` AND d.customer_id = $${params.length}`;
        }

        if (customer_id) {
            params.push(customer_id);
            query += ` AND d.customer_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND LOWER(d.verification_status) = LOWER($${params.length})`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (d.doc_type ILIKE $${params.length} OR d.doc_no ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR d.file_name ILIKE $${params.length} OR CAST(d.customer_id AS TEXT) ILIKE $${params.length} OR CAST(d.document_id AS TEXT) ILIKE $${params.length})`;
        }

        query += " ORDER BY d.document_id DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching documents:", err.message);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
};

// Get single document by ID (includes file_data for preview / download)
const getDocumentById = async (req, res) => {
    try {
        const documentId = req.params.id;

        const result = await pool.query(
            `SELECT d.*,
                    c.first_name || ' ' || c.last_name AS customer_name,
                    c.email AS customer_email,
                    c.mobile_no AS customer_mobile
             FROM document d
             JOIN customer c ON d.customer_id = c.customer_id
             WHERE d.document_id = $1`,
            [documentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching document:", err.message);
        res.status(500).json({ error: "Failed to fetch document" });
    }
};

// Create single or batch documents (supports adding as many documents as needed)
const createDocument = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let docItems = [];
        const topCustomerId = req.body.customer_id || (req.user?.role === "CUSTOMER" ? req.user.customer_id : null);
        const topVerificationStatus = req.body.verification_status || "Pending";

        if (Array.isArray(req.body)) {
            docItems = req.body;
        } else if (req.body.documents && Array.isArray(req.body.documents)) {
            docItems = req.body.documents.map((d) => ({
                ...d,
                customer_id: d.customer_id || topCustomerId,
                verification_status: d.verification_status || topVerificationStatus
            }));
        } else {
            docItems = [{
                customer_id: topCustomerId,
                doc_type: req.body.doc_type,
                doc_no: req.body.doc_no,
                verification_status: topVerificationStatus,
                file_name: req.body.file_name,
                file_type: req.body.file_type,
                file_size: req.body.file_size,
                file_data: req.body.file_data
            }];
        }

        if (docItems.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "No documents provided for upload" });
        }

        const inserted = [];
        for (const item of docItems) {
            const customerId = item.customer_id || topCustomerId;
            const docType = item.doc_type ? item.doc_type.trim() : null;
            const docNo = item.doc_no ? item.doc_no.trim() : null;
            const verificationStatus = item.verification_status || "Pending";
            const fileName = item.file_name ? item.file_name.trim() : null;
            const fileType = item.file_type ? item.file_type.trim() : null;
            const fileSize = item.file_size || null;
            const fileData = item.file_data || null;

            if (!customerId || !docType) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    error: "Customer ID and document type are required for all documents."
                });
            }

            const insertResult = await client.query(
                `INSERT INTO document
                    (customer_id, doc_type, doc_no, verification_status, file_name, file_type, file_size, file_data, uploaded_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                 RETURNING document_id, customer_id, doc_type, doc_no, verification_status, file_name, file_type, file_size, uploaded_at`,
                [customerId, docType, docNo, verificationStatus, fileName, fileType, fileSize, fileData]
            );

            inserted.push(insertResult.rows[0]);
        }

        await client.query("COMMIT");

        if (Array.isArray(req.body) || (req.body.documents && Array.isArray(req.body.documents))) {
            return res.status(201).json({
                message: `${inserted.length} document(s) uploaded successfully`,
                documents: inserted,
                count: inserted.length
            });
        } else {
            return res.status(201).json(inserted[0]);
        }

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error creating document(s):", err.message);
        res.status(500).json({ error: "Failed to create document(s)" });
    } finally {
        client.release();
    }
};

const updateDocument = async (req, res) => {
    try {
        const documentId = req.params.id;

        const {
            doc_type,
            doc_no,
            verification_status,
            customer_id,
            file_name,
            file_type,
            file_size,
            file_data
        } = req.body;

        const result = await pool.query(
            `UPDATE document
             SET
                doc_type = COALESCE($1, doc_type),
                doc_no = COALESCE($2, doc_no),
                verification_status = COALESCE($3, verification_status),
                customer_id = COALESCE($4, customer_id),
                file_name = COALESCE($5, file_name),
                file_type = COALESCE($6, file_type),
                file_size = COALESCE($7, file_size),
                file_data = COALESCE($8, file_data)
             WHERE document_id = $9
             RETURNING document_id, customer_id, doc_type, doc_no, verification_status, file_name, file_type, file_size, uploaded_at`,
            [
                doc_type ? doc_type.trim() : null,
                doc_no ? doc_no.trim() : null,
                verification_status || null,
                customer_id || null,
                file_name || null,
                file_type || null,
                file_size || null,
                file_data || null,
                documentId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating document:", err.message);
        res.status(500).json({ error: "Failed to update document" });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const user = req.user;

        let query = "DELETE FROM document WHERE document_id = $1";
        const params = [documentId];

        // If the user is a CUSTOMER, ensure they can only delete their own document
        if (user && user.role === "CUSTOMER" && user.customer_id) {
            params.push(user.customer_id);
            query += ` AND customer_id = $${params.length}`;
        }

        query += " RETURNING *";

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found or unauthorized to delete" });
        }

        res.json({
            message: "Document deleted successfully",
            document: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting document:", err.message);
        res.status(500).json({ error: "Failed to delete document" });
    }
};

module.exports = {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument
};

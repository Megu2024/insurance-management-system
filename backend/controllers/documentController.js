const pool = require("../db");

const createDocument = async (req, res) => {
    try {
        const {
            customer_id,
            doc_type,
            doc_no,
            verification_status
        } = req.body;

        const result = await pool.query(
            `INSERT INTO document
                (
                    customer_id,
                    doc_type,
                    doc_no,
                    verification_status
                )
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                customer_id,
                doc_type,
                doc_no,
                verification_status
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creating document:", err.message);

        res.status(500).json({
            error: "Failed to create document"
        });
    }
};

const updateDocument = async (req, res) => {
    try {
        const documentId = req.params.id;

        const {
            doc_type,
            doc_no,
            verification_status
        } = req.body;

        const result = await pool.query(
            `UPDATE document
             SET
                doc_type = $1,
                doc_no = $2,
                verification_status = $3
             WHERE document_id = $4
             RETURNING *`,
            [
                doc_type,
                doc_no,
                verification_status,
                documentId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Document not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error updating document:", err.message);

        res.status(500).json({
            error: "Failed to update document"
        });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;

        const result = await pool.query(
            `DELETE FROM document
             WHERE document_id = $1
             RETURNING *`,
            [documentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Document not found"
            });
        }

        res.json({
            message: "Document deleted successfully",
            document: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting document:", err.message);

        res.status(500).json({
            error: "Failed to delete document"
        });
    }
};

module.exports = {
    createDocument,
    updateDocument,
    deleteDocument
};

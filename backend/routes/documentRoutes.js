const express = require("express");
const router = express.Router();
const {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument
} = require("../controllers/documentController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/", createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
const express = require("express");

const router = express.Router();

const {
    createDocument,
    updateDocument,
    deleteDocument
} = require("../controllers/documentController");

router.post("/", createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
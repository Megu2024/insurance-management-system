const express = require("express");

const router = express.Router();

const {
    createProperty,
    updateProperty,
    deleteProperty
} = require("../controllers/propertyController");

router.post("/", createProperty);

router.put("/:id", updateProperty);

router.delete("/:id", deleteProperty);

module.exports = router;
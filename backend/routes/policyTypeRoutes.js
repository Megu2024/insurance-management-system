const express = require("express");

const router = express.Router();

const {
    getPolicyTypes
} = require("../controllers/policyTypeController");

router.get("/", getPolicyTypes);

module.exports = router;
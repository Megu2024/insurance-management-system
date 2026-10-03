const express = require("express");

const router = express.Router();

const {
    createHospital, updateHospital, deleteHospital
} = require("../controllers/hospitalController");

router.post("/", createHospital);
router.put("/:id", updateHospital);
router.delete("/:id", deleteHospital);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
    getHospitals,
    getHospitalById,
    createHospital,
    updateHospital,
    deleteHospital
} = require("../controllers/hospitalController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getHospitals);
router.get("/:id", getHospitalById);
router.post("/", createHospital);
router.put("/:id", updateHospital);
router.delete("/:id", deleteHospital);

module.exports = router;
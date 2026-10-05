const express = require("express");
const router = express.Router();
const {
    getClaims,
    getClaimById,
    createClaim,
    updateClaim,
    deleteClaim,
    getClaimHospital
} = require("../controllers/claimController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Authentication middleware applied
router.use(authenticateToken);

router.get("/", getClaims);
router.get("/:id", getClaimById);
router.get("/:id/hospital", getClaimHospital);
router.post("/", createClaim);
router.put("/:id", updateClaim);
router.delete("/:id", deleteClaim);

module.exports = router;
const express = require("express");

const router = express.Router();

const {
    createClaim, updateClaim, deleteClaim, getClaimHospital
} = require("../controllers/claimController");

router.post("/", createClaim);
router.put("/:id", updateClaim);
router.delete("/:id", deleteClaim);
router.get("/:id/hospital", getClaimHospital);

module.exports = router;
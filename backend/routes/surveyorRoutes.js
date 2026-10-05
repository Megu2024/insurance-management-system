const express = require("express");
const router = express.Router();
const {
    getSurveyors,
    getSurveyorById,
    getSurveyorClaims,
    createSurveyor,
    updateSurveyor,
    deleteSurveyor
} = require("../controllers/surveyorController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Public/authenticated reading
router.get("/", authenticateToken, getSurveyors);
router.get("/:id", authenticateToken, getSurveyorById);
router.get("/:id/claims", authenticateToken, getSurveyorClaims);

// Admin-only management
router.post("/", authenticateToken, requireRole("ADMIN"), createSurveyor);
router.put("/:id", authenticateToken, requireRole("ADMIN"), updateSurveyor);
router.delete("/:id", authenticateToken, requireRole("ADMIN"), deleteSurveyor);

module.exports = router;

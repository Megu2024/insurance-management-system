const express = require("express");
const router = express.Router();
const {
    getPolicyTypes,
    getPolicyTypeById,
    createPolicyType,
    updatePolicyType,
    deletePolicyType
} = require("../controllers/policyTypeController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Anyone logged in can read policy types
router.get("/", authenticateToken, getPolicyTypes);
router.get("/:id", authenticateToken, getPolicyTypeById);

// Admin-only management
router.post("/", authenticateToken, requireRole("ADMIN"), createPolicyType);
router.put("/:id", authenticateToken, requireRole("ADMIN"), updatePolicyType);
router.delete("/:id", authenticateToken, requireRole("ADMIN"), deletePolicyType);

module.exports = router;
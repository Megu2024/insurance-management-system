const express = require("express");
const router = express.Router();
const {
    getAgents,
    getAgentById,
    getAgentPolicies,
    getAgentCustomers,
    createAgent,
    updateAgent,
    deleteAgent
} = require("../controllers/agentController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getAgents);
router.get("/:id", getAgentById);
router.get("/:id/policies", getAgentPolicies);
router.get("/:id/customers", getAgentCustomers);

// Modifications require ADMIN role
router.post("/", requireRole("ADMIN"), createAgent);
router.put("/:id", requireRole("ADMIN"), updateAgent);
router.delete("/:id", requireRole("ADMIN"), deleteAgent);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
    getBranches,
    getBranchById,
    getBranchAgents,
    createBranch,
    updateBranch,
    deleteBranch
} = require("../controllers/branchController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getBranches);
router.get("/:id", getBranchById);
router.get("/:id/agents", getBranchAgents);

router.post("/", requireRole("ADMIN"), createBranch);
router.put("/:id", requireRole("ADMIN"), updateBranch);
router.delete("/:id", requireRole("ADMIN"), deleteBranch);

module.exports = router;
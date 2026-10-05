const express = require("express");
const router = express.Router();
const {
    getUsers,
    getPendingApprovals,
    approveUser,
    rejectUser,
    updateUserStatus,
    deleteUser
} = require("../controllers/userController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// All user management routes require ADMIN role
router.use(authenticateToken, requireRole("ADMIN"));

router.get("/", getUsers);
router.get("/pending", getPendingApprovals);
router.put("/:id/approve", approveUser);
router.put("/:id/reject", rejectUser);
router.put("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

module.exports = router;

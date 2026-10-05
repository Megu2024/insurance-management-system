const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Protected dashboard stats endpoint
router.get("/stats", authenticateToken, getDashboardStats);

module.exports = router;

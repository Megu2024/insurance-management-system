const express = require("express");
const router = express.Router();
const {
    login,
    registerCustomer,
    registerAgent,
    registerSurveyor,
    getMe,
    changePassword
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public endpoints
router.post("/login", login);
router.post("/register-customer", registerCustomer);
router.post("/register-agent", registerAgent);
router.post("/register-surveyor", registerSurveyor);

// Protected endpoints
router.get("/me", authenticateToken, getMe);
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;

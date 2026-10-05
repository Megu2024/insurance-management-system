const express = require("express");
const router = express.Router();
const {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
} = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Authentication middleware
router.use(authenticateToken);

router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

module.exports = router;
const express = require("express");

const router = express.Router();

const {
    createPayment, updatePayment, deletePayment
} = require("../controllers/paymentController");

router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

module.exports = router;
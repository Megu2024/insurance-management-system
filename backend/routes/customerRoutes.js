const express = require("express");
const router = express.Router();
const {
    getCustomers,
    getCustomerById,
    getCustomerPolicies,
    getCustomerDocuments,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require("../controllers/customerController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.get("/:id/policies", getCustomerPolicies);
router.get("/:id/documents", getCustomerDocuments);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", requireRole("ADMIN"), deleteCustomer);

module.exports = router;
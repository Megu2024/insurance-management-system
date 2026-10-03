const express = require("express");
const router = express.Router();
const { getCustomers, getCustomerById, getCustomerPolicies, getCustomerDocuments, createCustomer, updateCustomer, deleteCustomer } = require("../controllers/customerController");
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.get("/:id/policies", getCustomerPolicies);
router.get("/:id/documents", getCustomerDocuments);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);


module.exports = router;
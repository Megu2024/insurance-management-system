const express = require("express");

const router = express.Router();

const { getPolicies, getPolicyById, getPolicyPayments, getPolicyClaims, getPolicyVehicle, getPolicyProperty, getPolicyBusiness, getPolicyNominees, createPolicy, updatePolicyStatus, deletePolicy } = require("../controllers/policyController");
router.get("/", getPolicies);
router.get("/:id/payments", getPolicyPayments);
router.get("/:id/claims", getPolicyClaims);
router.get("/:id/vehicle", getPolicyVehicle);
router.get("/:id/property", getPolicyProperty);
router.get("/:id/business", getPolicyBusiness);
router.get("/:id/nominees", getPolicyNominees);
router.get("/:id", getPolicyById);
router.post("/", createPolicy);
router.put("/:id/status", updatePolicyStatus);
router.delete("/:id", deletePolicy);


module.exports = router;
const express = require("express");
const router = express.Router();
const {
    getBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
    deleteBusiness
} = require("../controllers/businessController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getBusinesses);
router.get("/:id", getBusinessById);
router.post("/", createBusiness);
router.put("/:id", updateBusiness);
router.delete("/:id", deleteBusiness);

module.exports = router;
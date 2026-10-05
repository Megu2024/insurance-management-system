const express = require("express");
const router = express.Router();
const {
    getNominees,
    getNomineeById,
    createNominee,
    updateNominee,
    deleteNominee
} = require("../controllers/nomineeController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getNominees);
router.get("/:id", getNomineeById);
router.post("/", createNominee);
router.put("/:id", updateNominee);
router.delete("/:id", deleteNominee);

module.exports = router;
const express = require("express");

const router = express.Router();

const {
    createNominee, updateNominee, deleteNominee
} = require("../controllers/nomineeController");

router.post("/", createNominee);
router.put("/:id", updateNominee);
router.delete("/:id", deleteNominee);

module.exports = router;
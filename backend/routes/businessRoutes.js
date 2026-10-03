const express = require("express");

const router = express.Router();

const {
    createBusiness,
    updateBusiness,
    deleteBusiness
} = require("../controllers/businessController");

router.post("/", createBusiness);

router.put("/:id", updateBusiness);

router.delete("/:id", deleteBusiness);

module.exports = router;
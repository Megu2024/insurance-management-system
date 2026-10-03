const express = require("express");

const router = express.Router();

const {
    createVehicle, updateVehicle, deleteVehicle
} = require("../controllers/vehicleController");

router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

module.exports = router;
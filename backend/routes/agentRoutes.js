const express = require("express");

const router = express.Router();

const {
    getAgents,
    getAgentById
} = require("../controllers/agentController");

router.get("/", getAgents);

router.get("/:id", getAgentById);

module.exports = router;
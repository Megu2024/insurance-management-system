require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

const PORT = process.env.PORT || 5000;

const pool = require("./db");

// Existing routes
const customerRoutes = require("./routes/customerRoutes");
const policyRoutes = require("./routes/policyRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const claimRoutes = require("./routes/claimRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const nomineeRoutes = require("./routes/nomineeRoutes");
const documentRoutes = require("./routes/documentRoutes");
const agentRoutes = require("./routes/agentRoutes");
const branchRoutes = require("./routes/branchRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const businessRoutes = require("./routes/businessRoutes");
const policyTypeRoutes = require("./routes/policyTypeRoutes");

// New security, user management, surveyor, and analytics routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const surveyorRoutes = require("./routes/surveyorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/nominees", nomineeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/surveyors", surveyorRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/policy-types", policyTypeRoutes);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Insurance Management System API is running!",
        status: "UP",
        timestamp: new Date()
    });
});

app.use(errorMiddleware);

async function testDatabaseConnection() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("Database connected successfully!");
        console.log("Database time:", result.rows[0].now);
    } catch (err) {
        console.error("Database connection failed:", err.message);
    }
}

testDatabaseConnection();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
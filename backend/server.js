const express = require("express");
const pool = require("./db");
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
const errorMiddleware = require("./middleware/errorMiddleware");
const cors = require("cors");

const app = express();
const PORT = 5000;
app.use(express.json());
app.use("/api/customers", customerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/nominees", nomineeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/policy-types", policyTypeRoutes);
app.use(errorMiddleware);
app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "Insurance Management System API is running!"
    });
})

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
})
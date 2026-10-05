const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "insurance_management_jwt_secret_key_2026_super_secure";

// Authenticate JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ error: "Access token required. Please log in." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token. Please log in again." });
        }

        req.user = user;
        next();
    });
};

// Require one of the specified roles
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Forbidden: Access requires one of the following roles: [${roles.join(", ")}]`
            });
        }

        next();
    };
};

// Require approved/active status
const requireApproval = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.status !== "APPROVED" && req.user.status !== "ACTIVE") {
        return res.status(403).json({
            error: "Your account is not approved or is inactive. Current status: " + req.user.status
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requireApproval
};

const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function runSelfTest() {
  console.log("=== Testing Authentication & Flow Directly ===");

  // 1. Check admin in users
  const adminRes = await pool.query("SELECT * FROM users WHERE email = 'admin@insurance.com'");
  if (adminRes.rows.length === 0) {
    throw new Error("Admin not found in DB");
  }
  const admin = adminRes.rows[0];
  const adminPwMatch = await bcrypt.compare("Admin@123456", admin.password_hash);
  console.log("1. Admin password verification:", adminPwMatch ? "PASSED" : "FAILED");

  // 2. Check customer in users
  const custRes = await pool.query("SELECT * FROM users WHERE email = 'rahul@gmail.com'");
  if (custRes.rows.length > 0) {
    const custPwMatch = await bcrypt.compare("Password@123", custRes.rows[0].password_hash);
    console.log("2. Demo customer password verification:", custPwMatch ? "PASSED" : "FAILED");
  }

  // 3. Test stats query
  const custCount = await pool.query("SELECT COUNT(*) FROM customer");
  const polCount = await pool.query("SELECT COUNT(*) FROM policy");
  const claimCount = await pool.query("SELECT COUNT(*) FROM claim");
  console.log(`3. Stats query: Customers=${custCount.rows[0].count}, Policies=${polCount.rows[0].count}, Claims=${claimCount.rows[0].count}`);

  await pool.end();
  console.log("=== Self-test finished successfully! ===");
}

runSelfTest().catch(err => {
  console.error(err);
  process.exit(1);
});

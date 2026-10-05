const pool = require("../db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env");
    process.exit(1);
  }

  try {
    // Ensure users table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER', 'AGENT', 'SURVEYOR')),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE')),
        customer_id INTEGER NULL REFERENCES customer(customer_id) ON DELETE SET NULL,
        agent_id INTEGER NULL REFERENCES agent(agent_id) ON DELETE SET NULL,
        surveyor_id INTEGER NULL REFERENCES surveyor(surveyor_id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const res = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);

    if (res.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (username, email, password_hash, role, status)
         VALUES ($1, $2, $3, 'ADMIN', 'APPROVED')`,
        ["admin", adminEmail, hash]
      );
      console.log(`[Admin Seed] Admin user successfully created with email: ${adminEmail}`);
    } else {
      // Update password hash to match current env if already existing
      await pool.query(
        `UPDATE users SET password_hash = $1, status = 'APPROVED', role = 'ADMIN' WHERE email = $2`,
        [hash, adminEmail]
      );
      console.log(`[Admin Seed] Admin user already exists. Credentials updated for: ${adminEmail}`);
    }
  } catch (err) {
    console.error("[Admin Seed] Error seeding admin:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;

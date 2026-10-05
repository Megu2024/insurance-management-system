const pool = require("../db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function initDb() {
  console.log("Starting database initialization and migration...");

  try {
    // 1. Create sequences if not exist and set defaults
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS branch_branch_id_seq START WITH 10;
      ALTER TABLE branch ALTER COLUMN branch_id SET DEFAULT nextval('branch_branch_id_seq');
      SELECT setval('branch_branch_id_seq', GREATEST(COALESCE((SELECT MAX(branch_id) FROM branch), 0), 9) + 1, false);

      CREATE SEQUENCE IF NOT EXISTS agent_agent_id_seq START WITH 200;
      ALTER TABLE agent ALTER COLUMN agent_id SET DEFAULT nextval('agent_agent_id_seq');
      SELECT setval('agent_agent_id_seq', GREATEST(COALESCE((SELECT MAX(agent_id) FROM agent), 0), 199) + 1, false);

      CREATE SEQUENCE IF NOT EXISTS surveyor_surveyor_id_seq START WITH 400;
      ALTER TABLE surveyor ALTER COLUMN surveyor_id SET DEFAULT nextval('surveyor_surveyor_id_seq');
      SELECT setval('surveyor_surveyor_id_seq', GREATEST(COALESCE((SELECT MAX(surveyor_id) FROM surveyor), 0), 399) + 1, false);

      CREATE SEQUENCE IF NOT EXISTS policy_type_policy_type_id_seq START WITH 10;
      ALTER TABLE policy_type ALTER COLUMN policy_type_id SET DEFAULT nextval('policy_type_policy_type_id_seq');
      SELECT setval('policy_type_policy_type_id_seq', GREATEST(COALESCE((SELECT MAX(policy_type_id) FROM policy_type), 0), 9) + 1, false);

      ALTER TABLE agent DROP CONSTRAINT IF EXISTS agent_branch_id_fkey;
      ALTER TABLE agent ADD CONSTRAINT agent_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE SET NULL;
    `);
    console.log("Sequences, column defaults, and branch foreign keys verified.");

    // 2. Create users table
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
    console.log("Users table verified.");

    // 3. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || "admin@insurance.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

    const adminCheck = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, status)
        VALUES ($1, $2, $3, 'ADMIN', 'APPROVED')
      `, ["admin", adminEmail, hash]);
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    // 4. Seed demo users for existing customer, agent, surveyor if they don't have accounts
    const defaultPassword = "Password@123";
    const defaultHash = await bcrypt.hash(defaultPassword, 10);

    // Customer
    const customerRes = await pool.query("SELECT customer_id, email, first_name FROM customer LIMIT 1");
    if (customerRes.rows.length > 0) {
      const c = customerRes.rows[0];
      const uCheck = await pool.query("SELECT * FROM users WHERE email = $1", [c.email]);
      if (uCheck.rows.length === 0) {
        await pool.query(`
          INSERT INTO users (username, email, password_hash, role, status, customer_id)
          VALUES ($1, $2, $3, 'CUSTOMER', 'APPROVED', $4)
        `, [c.email, c.email, defaultHash, c.customer_id]);
        console.log(`Demo customer user created: ${c.email}`);
      }
    }

    // Agent (Approved)
    const agentRes = await pool.query("SELECT agent_id, email, agent_name FROM agent LIMIT 1");
    if (agentRes.rows.length > 0) {
      const a = agentRes.rows[0];
      const uCheck = await pool.query("SELECT * FROM users WHERE email = $1", [a.email]);
      if (uCheck.rows.length === 0) {
        await pool.query(`
          INSERT INTO users (username, email, password_hash, role, status, agent_id)
          VALUES ($1, $2, $3, 'AGENT', 'APPROVED', $4)
        `, [a.email, a.email, defaultHash, a.agent_id]);
        console.log(`Demo agent user created: ${a.email}`);
      }
    }

    // Surveyor (Approved)
    const surveyorRes = await pool.query("SELECT surveyor_id, email, surveyor_name FROM surveyor LIMIT 1");
    if (surveyorRes.rows.length > 0) {
      const s = surveyorRes.rows[0];
      const uCheck = await pool.query("SELECT * FROM users WHERE email = $1", [s.email]);
      if (uCheck.rows.length === 0) {
        await pool.query(`
          INSERT INTO users (username, email, password_hash, role, status, surveyor_id)
          VALUES ($1, $2, $3, 'SURVEYOR', 'APPROVED', $4)
        `, [s.email, s.email, defaultHash, s.surveyor_id]);
        console.log(`Demo surveyor user created: ${s.email}`);
      }
    }

    console.log("Database initialization completed successfully!");
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;

-- =============================================================================
-- INSURANCE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- PostgreSQL Relational Database Schema with Integrity Constraints & Triggers
-- =============================================================================

-- 1. BRANCH TABLE
CREATE TABLE IF NOT EXISTS branch (
    branch_id INTEGER PRIMARY KEY,
    branch_name_1 VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(50),
    state VARCHAR(50),
    manager_name VARCHAR(100)
);

CREATE SEQUENCE IF NOT EXISTS branch_branch_id_seq START WITH 10;
ALTER TABLE branch ALTER COLUMN branch_id SET DEFAULT nextval('branch_branch_id_seq');

-- 2. AGENT TABLE
CREATE TABLE IF NOT EXISTS agent (
    agent_id INTEGER PRIMARY KEY,
    branch_id INTEGER REFERENCES branch(branch_id) ON DELETE SET NULL,
    agent_name VARCHAR(100) NOT NULL,
    mobile_no VARCHAR(20),
    email VARCHAR(100),
    license_no VARCHAR(50)
);

CREATE SEQUENCE IF NOT EXISTS agent_agent_id_seq START WITH 200;
ALTER TABLE agent ALTER COLUMN agent_id SET DEFAULT nextval('agent_agent_id_seq');

-- 3. CUSTOMER TABLE
CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    aadhaar_no VARCHAR(20),
    pan_no VARCHAR(20),
    dob DATE,
    gender VARCHAR(10),
    mobile_no VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(20),
    occupation VARCHAR(50),
    annual_income NUMERIC CHECK (annual_income >= 0),
    customer_status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 4. POLICY TYPE TABLE
CREATE TABLE IF NOT EXISTS policy_type (
    policy_type_id INTEGER PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS policy_type_policy_type_id_seq START WITH 10;
ALTER TABLE policy_type ALTER COLUMN policy_type_id SET DEFAULT nextval('policy_type_policy_type_id_seq');

-- 5. POLICY TABLE
CREATE TABLE IF NOT EXISTS policy (
    policy_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
    policy_type_id INTEGER REFERENCES policy_type(policy_type_id) ON DELETE RESTRICT,
    start_date DATE,
    end_date DATE,
    premium_amt NUMERIC CHECK (premium_amt >= 0),
    agent_id INTEGER REFERENCES agent(agent_id) ON DELETE SET NULL,
    policy_no VARCHAR(50) UNIQUE,
    sum_coverage NUMERIC CHECK (sum_coverage >= 0),
    policy_status VARCHAR(20) DEFAULT 'ACTIVE',
    payment_freq VARCHAR(20),
    created_date DATE DEFAULT CURRENT_DATE
);

-- 6. PREMIUM PAYMENT TABLE
CREATE TABLE IF NOT EXISTS premium_payment (
    payment_id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy(policy_id) ON DELETE CASCADE,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC CHECK (amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'Successful',
    payment_mode VARCHAR(30)
);

-- 7. SURVEYOR TABLE
CREATE TABLE IF NOT EXISTS surveyor (
    surveyor_id INTEGER PRIMARY KEY,
    surveyor_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    license_no VARCHAR(50),
    experience INTEGER CHECK (experience >= 0)
);

CREATE SEQUENCE IF NOT EXISTS surveyor_surveyor_id_seq START WITH 400;
ALTER TABLE surveyor ALTER COLUMN surveyor_id SET DEFAULT nextval('surveyor_surveyor_id_seq');

-- 8. CLAIM TABLE
CREATE TABLE IF NOT EXISTS claim (
    claim_id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy(policy_id) ON DELETE CASCADE,
    claim_date DATE DEFAULT CURRENT_DATE,
    claim_amount NUMERIC CHECK (claim_amount >= 0),
    claim_status VARCHAR(30) DEFAULT 'Pending',
    description TEXT,
    surveyor_id INTEGER REFERENCES surveyor(surveyor_id) ON DELETE SET NULL,
    approve_amt NUMERIC DEFAULT 0 CHECK (approve_amt >= 0)
);

-- 9. VEHICLE ASSET TABLE (1:1 with Policy)
CREATE TABLE IF NOT EXISTS vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    policy_id INTEGER UNIQUE REFERENCES policy(policy_id) ON DELETE CASCADE,
    reg_no VARCHAR(30),
    manufacturer VARCHAR(50),
    model VARCHAR(50),
    engine_no VARCHAR(50)
);

-- 10. PROPERTY ASSET TABLE (1:1 with Policy)
CREATE TABLE IF NOT EXISTS property (
    property_id SERIAL PRIMARY KEY,
    policy_id INTEGER UNIQUE REFERENCES policy(policy_id) ON DELETE CASCADE,
    property_type VARCHAR(50),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    construction_year INTEGER,
    market_value NUMERIC CHECK (market_value >= 0),
    usage_type VARCHAR(50)
);

-- 11. BUSINESS ASSET TABLE (1:1 with Policy)
CREATE TABLE IF NOT EXISTS business (
    business_id SERIAL PRIMARY KEY,
    policy_id INTEGER UNIQUE REFERENCES policy(policy_id) ON DELETE CASCADE,
    business_name VARCHAR(100) NOT NULL,
    industry_type VARCHAR(50),
    address TEXT,
    gst_no VARCHAR(50),
    annual_turnover NUMERIC CHECK (annual_turnover >= 0),
    employee_count INTEGER CHECK (employee_count >= 0)
);

-- 12. HOSPITAL TABLE (Linked to Claim)
CREATE TABLE IF NOT EXISTS hospital (
    hospital_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim(claim_id) ON DELETE CASCADE,
    hospital_name VARCHAR(100) NOT NULL,
    city VARCHAR(50),
    admission_date DATE,
    discharge_date DATE,
    bill_amt NUMERIC CHECK (bill_amt >= 0)
);

-- 13. NOMINEE TABLE (Linked to Policy)
CREATE TABLE IF NOT EXISTS nominee (
    nominee_id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy(policy_id) ON DELETE CASCADE,
    nominee_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    dob DATE,
    mobile_no VARCHAR(20)
);

-- 14. DOCUMENT TABLE (Linked to Customer)
CREATE TABLE IF NOT EXISTS document (
    document_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    doc_no VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'Pending',
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    file_data TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT LOG TABLE FOR POLICY STATUS CHANGES
CREATE TABLE IF NOT EXISTS policy_status_audit (
    audit_id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy(policy_id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. USERS TABLE (Authentication & Role-Based Access Control)
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

-- 17. VIEW FOR ACTIVE POLICIES
CREATE OR REPLACE VIEW active_policies AS
SELECT
    p.policy_id,
    p.policy_no,
    p.start_date,
    p.end_date,
    p.premium_amt,
    p.sum_coverage,
    p.payment_freq,
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    pt.policy_type_id,
    pt.policy_name,
    pt.category
FROM policy p
JOIN customer c ON p.customer_id = c.customer_id
JOIN policy_type pt ON p.policy_type_id = pt.policy_type_id
WHERE LOWER(p.policy_status) = 'active';

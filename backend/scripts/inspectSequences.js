const pool = require("../db");

async function check() {
  const seqs = await pool.query(
    "SELECT c.relname FROM pg_class c WHERE c.relkind = 'S'"
  );
  console.log("Sequences:", seqs.rows.map(r => r.relname));
  await pool.end();
}

check().catch(console.error);

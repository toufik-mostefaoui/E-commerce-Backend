// db.js
import dotenv from "dotenv";
dotenv.config(); // Load .env BEFORE creating pool

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "localhost", // ← Or 'postgres' if running Node.js inside Docker
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

export default pool;

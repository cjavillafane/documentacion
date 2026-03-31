// backend/db.js
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/olimpiadas';
const pool = new Pool({ connectionString });
export default pool;


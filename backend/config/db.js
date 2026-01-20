import pkg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

const { Pool } = pkg;

// Create a connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Neon
});

// Test the connection
(async () => {
    try {
        const res = await pool.query("SELECT NOW()");
        console.log("✅ Connected to Neon DB at:", res.rows[0].now);
    } catch (err) {
        console.error("❌ DB connection error:", err.message);
    }
})();
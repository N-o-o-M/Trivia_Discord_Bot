import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Simplified resetTables function
async function resetTables() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Drop existing tables
    await client.query(`
      DROP TABLE IF EXISTS category_stats;
      DROP TABLE IF EXISTS scores;
    `);

    // Create scores table
    await client.query(`
      CREATE TABLE scores (
        user_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        points INT DEFAULT 0,
        correct_answers INT DEFAULT 0,
        total_answers INT DEFAULT 0,
        streak INT DEFAULT 0,
        highest_streak INT DEFAULT 0,
        last_answer_time TIMESTAMP
      );
    `);

    // Create category_stats table
    await client.query(`
      CREATE TABLE category_stats (
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        correct_answers INT DEFAULT 0,
        total_answers INT DEFAULT 0,
        PRIMARY KEY (user_id, category)
      );
    `);

    await client.query("COMMIT");
    console.log("Database tables reset successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database error:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

resetTables();

export default pool;

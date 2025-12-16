import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../credentials/.env" });

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL/NeonDB");
    await client.end();
  } catch (error) {
    console.error("Connection failed", error);
  }
}

testConnection();

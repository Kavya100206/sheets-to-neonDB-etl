import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: "../credentials/.env" });

const { Client } = pkg;

async function testSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log("✓ Connected to NeonDB\n");

        // Read and execute schema
        const schemaSql = fs.readFileSync("../database/schema.sql", "utf-8");
        await client.query(schemaSql);
        console.log("✓ Schema executed successfully\n");

        // Get table list
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

        console.log(`✓ Created ${tables.rows.length} tables:`);
        tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));

        console.log("\n✅ Schema test PASSED!");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

testSchema();

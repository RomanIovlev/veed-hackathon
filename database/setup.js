#!/usr/bin/env node

/**
 * Database Setup Script for CareLearn Training Platform
 * 
 * This script sets up the PostgreSQL database schema for production deployment.
 * It can be used with cloud databases like Neon, Supabase, or Railway.
 * 
 * Usage:
 *   node database/setup.js <DATABASE_URL>
 *   
 * Or set the DATABASE_URL environment variable:
 *   DATABASE_URL=postgresql://... node database/setup.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  // Get database URL from command line argument or environment variable
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is required');
    console.log('Usage: node database/setup.js <DATABASE_URL>');
    console.log('Or set DATABASE_URL environment variable');
    process.exit(1);
  }

  console.log('🚀 Setting up CareLearn database...');
  
  // Create database client
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute migration file
    console.log('📄 Reading migration file...');
    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executing database migration...');
    await client.query(migrationSql);
    console.log('✅ Database schema created successfully');

    // Verify setup
    console.log('🔍 Verifying setup...');
    const result = await client.query(`
      SELECT 
        schemaname, 
        tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('training_documents', 'video_scripts', 'quiz_questions', 'users')
      ORDER BY tablename
    `);

    if (result.rows.length === 4) {
      console.log('✅ All tables created successfully:');
      result.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    } else {
      console.log('⚠️  Warning: Not all tables were created');
      console.log('Created tables:', result.rows.map(row => row.tablename));
    }

    // Check for sample data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const trainingCount = await client.query('SELECT COUNT(*) FROM training_documents');
    
    console.log(`📊 Database populated with:`);
    console.log(`  - ${userCount.rows[0].count} users`);
    console.log(`  - ${trainingCount.rows[0].count} training documents`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set your DATABASE_URL environment variable in Netlify');
    console.log('2. Deploy your application');
    console.log('3. Test the API endpoints');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Check that your database URL is correct');
      console.log('  - Ensure your database server is running');
      console.log('  - Verify network connectivity');
    } else if (error.code === '28P01') {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Check your database credentials');
      console.log('  - Verify username and password in connection string');
    } else if (error.code === '3D000') {
      console.log('\n💡 Troubleshooting:');
      console.log('  - Check that the database name exists');
      console.log('  - Create the database first if needed');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('📡 Database connection closed');
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };
#!/usr/bin/env node
/**
 * PostgreSQL Migration Script for Production Deployment
 * 
 * This script runs the PostgreSQL migrations and generates Prisma Client.
 * Designed to run in Vercel's build environment.
 * 
 * Usage: node scripts/migrate-postgres.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting PostgreSQL migration...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Verify it's a PostgreSQL connection
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ Error: DATABASE_URL must be a PostgreSQL connection string');
  console.error('   Current value starts with:', databaseUrl.substring(0, 20));
  process.exit(1);
}

console.log('✅ PostgreSQL DATABASE_URL detected');

try {
  // Step 1: Generate Prisma Client from PostgreSQL schema
  console.log('\n📦 Step 1: Generating Prisma Client...');
  try {
    execSync('npx prisma generate --schema=prisma/schema.postgres.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Prisma Client generated successfully');
  } catch (generateError) {
    console.error('❌ Failed to generate Prisma Client:', generateError.message);
    throw new Error('Prisma Client generation failed');
  }

  // Step 2: Run Prisma migrate deploy (if using Prisma migrations)
  console.log('\n🔄 Step 2: Running Prisma migrations...');
  
  // Check if there's a migration_lock.toml and if it's for SQLite
  const migrationLockPath = path.join(__dirname, '..', 'prisma', 'migrations', 'migration_lock.toml');
  let skipPrismaMigrate = false;
  
  if (fs.existsSync(migrationLockPath)) {
    const lockContent = fs.readFileSync(migrationLockPath, 'utf8');
    if (lockContent.includes('provider = "sqlite"')) {
      console.log('⚠️  Detected SQLite migrations in prisma/migrations directory');
      console.log('   Skipping prisma migrate deploy (incompatible with PostgreSQL)');
      console.log('   Will use custom PostgreSQL migration instead...');
      skipPrismaMigrate = true;
    }
  }
  
  if (!skipPrismaMigrate) {
    try {
      // First, try to use Prisma's built-in migration system
      execSync('npx prisma migrate deploy --schema=prisma/schema.postgres.prisma', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });
      console.log('✅ Prisma migrations completed successfully');
    } catch (migrateError) {
      console.log('⚠️  Prisma migrate deploy failed or no migrations found');
      console.error('   Error:', migrateError.message);
      console.log('   Attempting direct SQL migration...');
      skipPrismaMigrate = true;
    }
  }
  
  // Step 3: If Prisma migrate was skipped or failed, run our custom SQL migration
  if (skipPrismaMigrate) {
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations-postgres', 'init.sql');
    
    if (fs.existsSync(migrationPath)) {
      console.log('\n📄 Step 3: Running custom SQL migration...');
      
      // Use .tmp directory for temporary files (should be in .gitignore)
      const tmpDir = path.join(__dirname, '..', '.tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tempSqlFile = path.join(tmpDir, `migration-${Date.now()}.sql`);
      
      try {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        // Write to temp file
        fs.writeFileSync(tempSqlFile, migrationSql);
        
        // Use Prisma db execute to run the SQL
        execSync(`npx prisma db execute --schema=prisma/schema.postgres.prisma --file=${tempSqlFile}`, {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..'),
        });
        
        console.log('✅ Custom SQL migration completed successfully');
      } catch (sqlError) {
        console.error('❌ Error running SQL migration:', sqlError.message);
        throw sqlError;
      } finally {
        // Always clean up temp file
        if (fs.existsSync(tempSqlFile)) {
          fs.unlinkSync(tempSqlFile);
        }
      }
    } else {
      console.log('⚠️  No custom migration file found at:', migrationPath);
      console.log('   Database schema may not be created. Please check manually.');
    }
  }


  console.log('\n✅ Migration completed successfully!');
  console.log('   Your database is ready for production use.');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Verify DATABASE_URL is correctly set in Vercel environment variables');
  console.error('2. Ensure the PostgreSQL database exists and is accessible');
  console.error('3. Check that the database user has proper permissions');
  console.error('4. Review the error message above for specific issues');
  process.exit(1);
}

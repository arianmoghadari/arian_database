#!/usr/bin/env node

const { sequelize } = require('../models');
const { execSync } = require('child_process');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run migrations
    console.log('🔄 Running migrations...');
    try {
      execSync('npx sequelize-cli db:migrate', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../../')
      });
      console.log('✅ Migrations completed');
    } catch (error) {
      console.log('⚠️  Migrations failed or already up to date');
    }
    
    // Run seeders in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Running seeders...');
      try {
        execSync('npx sequelize-cli db:seed:all', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '../../')
        });
        console.log('✅ Seeders completed');
      } catch (error) {
        console.log('⚠️  Seeders failed or already run');
      }
    }
    
    console.log('🎉 Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };

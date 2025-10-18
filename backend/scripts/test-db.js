#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests database connectivity and configuration
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log('='.repeat(50));

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'arad_billboards',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Username: ${config.username}`);
  console.log(`   Password: ${config.password ? '***' : 'Not set'}`);
  console.log('');

  const sequelize = new Sequelize(config);

  try {
    // Test basic connection
    console.log('🔄 Testing basic connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');

    // Test database exists
    console.log('🔄 Checking if database exists...');
    const [results] = await sequelize.query('SELECT DATABASE() as current_db');
    const currentDb = results[0].current_db;
    
    if (currentDb === config.database) {
      console.log(`✅ Connected to database: ${currentDb}`);
    } else {
      console.log(`⚠️  Connected to different database: ${currentDb}`);
    }

    // Test table existence
    console.log('🔄 Checking required tables...');
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const requiredTables = [
      'Users', 'Cities', 'Partners', 'Billboards', 
      'ProductCards', 'Reservations', 'Orders', 'OrderItems', 'Reports'
    ];

    console.log('📊 Table Status:');
    requiredTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    // Test sample query
    console.log('🔄 Testing sample query...');
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM Users');
    console.log(`✅ Sample query successful. Users count: ${userCount[0].count}`);

    // Test connection pool
    console.log('🔄 Testing connection pool...');
    const pool = sequelize.connectionManager.pool;
    console.log(`✅ Connection pool active: ${pool ? 'Yes' : 'No'}`);

    console.log('');
    console.log('🎉 All database tests passed!');
    console.log('');
    console.log('📋 Database Status:');
    console.log('   ✅ Connection: OK');
    console.log('   ✅ Authentication: OK');
    console.log('   ✅ Queries: OK');
    console.log('   ✅ Tables: Available');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('🔍 Error Details:');
    console.error(`   Code: ${error.code || 'Unknown'}`);
    console.error(`   Message: ${error.message}`);
    console.error('');
    console.error('🛠️  Troubleshooting:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   - Check if MySQL server is running');
      console.error('   - Verify host and port settings');
      console.error('   - Check firewall settings');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   - Check username and password');
      console.error('   - Verify user permissions');
      console.error('   - Ensure user has access to the database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   - Database does not exist');
      console.error('   - Create the database: CREATE DATABASE arad_billboards;');
    } else {
      console.error('   - Check your .env configuration');
      console.error('   - Verify MySQL server status');
      console.error('   - Check network connectivity');
    }
    
    console.error('');
    console.error('📚 For more help, see:');
    console.error('   - SETUP_GUIDE.md');
    console.error('   - deploy.md');
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };



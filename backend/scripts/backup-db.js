#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'arad_billboards',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log('🔄 Creating database backup...');
    
    const command = `mysqldump -h ${config.host} -P ${config.port} -u ${config.user} -p${config.password} ${config.database} > "${backupFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Backup created: ${backupFile}`);
    
    // Keep only last 10 backups
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`🗑️  Deleted old backup: ${file}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

function restoreBackup(backupFile) {
  if (!fs.existsSync(backupFile)) {
    console.error('❌ Backup file not found:', backupFile);
    process.exit(1);
  }

  try {
    console.log('🔄 Restoring database from backup...');
    
    const command = `mysql -h ${config.host} -P ${config.port} -u ${config.user} -p${config.password} ${config.database} < "${backupFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Database restored successfully');
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    createBackup();
    break;
  case 'restore':
    const backupFile = args[1];
    if (!backupFile) {
      console.error('❌ Please specify backup file: node backup-db.js restore <backup-file>');
      process.exit(1);
    }
    restoreBackup(backupFile);
    break;
  default:
    console.log('Usage:');
    console.log('  node backup-db.js create          - Create new backup');
    console.log('  node backup-db.js restore <file>  - Restore from backup');
    break;
}

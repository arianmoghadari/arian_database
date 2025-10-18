#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Automatically configures the application for production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupProductionEnvironment() {
  console.log('🚀 Arad Billboards - Production Environment Setup');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Check if .env already exists
    const envPath = path.join(__dirname, '..', '.env');
    const envExists = fs.existsSync(envPath);
    
    if (envExists) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Setup cancelled.');
        process.exit(0);
      }
    }

    console.log('📝 Please provide the following information:');
    console.log('');

    // Database configuration
    const dbHost = await question('Database Host (default: 127.0.0.1): ') || '127.0.0.1';
    const dbPort = await question('Database Port (default: 3306): ') || '3306';
    const dbName = await question('Database Name (default: arad_billboards): ') || 'arad_billboards';
    const dbUser = await question('Database User (default: arad_user): ') || 'arad_user';
    const dbPassword = await question('Database Password: ');

    // Server configuration
    const serverPort = await question('Server Port (default: 3000): ') || '3000';
    const domain = await question('Production Domain (e.g., https://yourdomain.com): ');

    // Generate secure secrets
    console.log('');
    console.log('🔐 Generating secure secrets...');
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    const sessionSecret = crypto.randomBytes(32).toString('hex');

    // Create .env content
    const envContent = `# Production Environment Configuration
# Generated on: ${new Date().toISOString()}

# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=production
PORT=${serverPort}

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=24h

# ===========================================
# CORS CONFIGURATION
# ===========================================
CORS_ORIGIN=${domain},https://www.${domain.replace('https://', '')}

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_PATH=public/uploads

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5
RATE_LIMIT_UPLOAD_MAX_REQUESTS=10

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
SESSION_SECRET=${sessionSecret}
SESSION_MAX_AGE=86400000

# ===========================================
# LOGGING CONFIGURATION
# ===========================================
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# ===========================================
# BACKUP CONFIGURATION
# ===========================================
BACKUP_PATH=backups
BACKUP_RETENTION_DAYS=30

# ===========================================
# MONITORING & HEALTH CHECK
# ===========================================
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');

    // Create production startup script
    const startupScript = `#!/bin/bash
# Production Startup Script for Arad Billboards

echo "🚀 Starting Arad Billboards in Production Mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please run: node scripts/setup-production.js"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm ci --only=production
fi

# Check database connection
echo "🔍 Checking database connection..."
npm run test-db

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed!"
    exit 1
fi

# Run migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Start the application
echo "🌟 Starting application..."
npm start
`;

    fs.writeFileSync(path.join(__dirname, '..', 'start-production.sh'), startupScript);
    fs.chmodSync(path.join(__dirname, '..', 'start-production.sh'), '755');

    console.log('✅ Production startup script created!');

    // Create PM2 ecosystem file
    const pm2Config = {
      apps: [{
        name: 'arad-billboards',
        script: './bin/www',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: serverPort
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true,
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=1024'
      }]
    };

    fs.writeFileSync(
      path.join(__dirname, '..', 'ecosystem.config.js'),
      `module.exports = ${JSON.stringify(pm2Config, null, 2)};`
    );

    console.log('✅ PM2 ecosystem configuration created!');

    // Display next steps
    console.log('');
    console.log('🎉 Production environment setup completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Review the generated .env file');
    console.log('2. Set up your MySQL database with the provided credentials');
    console.log('3. Run: npm run init-db');
    console.log('4. Test the application: npm run test-api');
    console.log('5. Start with PM2: pm2 start ecosystem.config.js');
    console.log('6. Save PM2 config: pm2 save && pm2 startup');
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('- Keep your .env file secure and never commit it to version control');
    console.log('- Your JWT secret has been generated securely');
    console.log('- Consider setting up SSL/TLS certificates');
    console.log('- Configure firewall rules for your server');
    console.log('');
    console.log('📚 Documentation:');
    console.log('- See deploy.md for detailed deployment instructions');
    console.log('- Check API_DOCUMENTATION.md for API reference');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  setupProductionEnvironment();
}

module.exports = { setupProductionEnvironment };



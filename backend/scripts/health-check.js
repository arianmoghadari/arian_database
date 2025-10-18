#!/usr/bin/env node

/**
 * Advanced Health Check Script for Arad Billboards
 * Comprehensive health monitoring for production environments
 */

const http = require('http');
const https = require('https');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      checks: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runAllChecks() {
    console.log('🔍 Starting comprehensive health check...');
    console.log('='.repeat(60));

    try {
      await Promise.all([
        this.checkApplication(),
        this.checkDatabase(),
        this.checkDiskSpace(),
        this.checkMemory(),
        this.checkNetwork(),
        this.checkSSL(),
        this.checkLogs(),
        this.checkPM2()
      ]);

      this.calculateOverallHealth();
      this.displayResults();
      this.saveResults();

      // Exit with appropriate code
      process.exit(this.results.overall === 'healthy' ? 0 : 1);

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  async checkApplication() {
    console.log('🔄 Checking application health...');
    
    try {
      const response = await this.makeRequest('GET', '/api/admin/health');
      
      if (response.statusCode === 200) {
        this.addResult('application', 'healthy', 'Application is responding correctly');
      } else {
        this.addResult('application', 'unhealthy', `Application returned status ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('application', 'unhealthy', `Application check failed: ${error.message}`);
    }
  }

  async checkDatabase() {
    console.log('🔄 Checking database connection...');
    
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'arad_billboards'
      });

      // Test basic connection
      await connection.ping();
      
      // Test query performance
      const start = Date.now();
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM Users');
      const duration = Date.now() - start;
      
      await connection.end();

      if (duration < 1000) {
        this.addResult('database', 'healthy', `Database responding in ${duration}ms`);
      } else {
        this.addResult('database', 'warning', `Database slow response: ${duration}ms`);
      }
    } catch (error) {
      this.addResult('database', 'unhealthy', `Database connection failed: ${error.message}`);
    }
  }

  async checkDiskSpace() {
    console.log('🔄 Checking disk space...');
    
    try {
      const stats = await this.getDiskUsage();
      const usagePercent = (stats.used / stats.total) * 100;
      
      if (usagePercent < 80) {
        this.addResult('disk', 'healthy', `Disk usage: ${usagePercent.toFixed(1)}%`);
      } else if (usagePercent < 90) {
        this.addResult('disk', 'warning', `Disk usage high: ${usagePercent.toFixed(1)}%`);
      } else {
        this.addResult('disk', 'unhealthy', `Disk usage critical: ${usagePercent.toFixed(1)}%`);
      }
    } catch (error) {
      this.addResult('disk', 'unhealthy', `Disk check failed: ${error.message}`);
    }
  }

  async checkMemory() {
    console.log('🔄 Checking memory usage...');
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const usagePercent = ((totalMem - freeMem) / totalMem) * 100;
      
      if (usagePercent < 80) {
        this.addResult('memory', 'healthy', `Memory usage: ${usagePercent.toFixed(1)}%`);
      } else if (usagePercent < 90) {
        this.addResult('memory', 'warning', `Memory usage high: ${usagePercent.toFixed(1)}%`);
      } else {
        this.addResult('memory', 'unhealthy', `Memory usage critical: ${usagePercent.toFixed(1)}%`);
      }
    } catch (error) {
      this.addResult('memory', 'unhealthy', `Memory check failed: ${error.message}`);
    }
  }

  async checkNetwork() {
    console.log('🔄 Checking network connectivity...');
    
    try {
      // Test external connectivity
      const response = await this.makeRequest('GET', 'https://httpbin.org/status/200');
      
      if (response.statusCode === 200) {
        this.addResult('network', 'healthy', 'External network connectivity OK');
      } else {
        this.addResult('network', 'warning', 'External network connectivity issues');
      }
    } catch (error) {
      this.addResult('network', 'warning', `Network check failed: ${error.message}`);
    }
  }

  async checkSSL() {
    console.log('🔄 Checking SSL configuration...');
    
    try {
      const domain = process.env.CORS_ORIGIN?.split(',')[0]?.replace('https://', '') || 'localhost';
      
      if (domain === 'localhost') {
        this.addResult('ssl', 'warning', 'SSL not configured (localhost)');
        return;
      }

      const response = await this.makeRequest('GET', `https://${domain}/api/admin/health`);
      
      if (response.statusCode === 200) {
        this.addResult('ssl', 'healthy', 'SSL certificate valid');
      } else {
        this.addResult('ssl', 'unhealthy', 'SSL certificate issues');
      }
    } catch (error) {
      this.addResult('ssl', 'unhealthy', `SSL check failed: ${error.message}`);
    }
  }

  async checkLogs() {
    console.log('🔄 Checking log files...');
    
    try {
      const logDir = path.join(__dirname, '..', 'logs');
      
      if (!fs.existsSync(logDir)) {
        this.addResult('logs', 'warning', 'Log directory not found');
        return;
      }

      const logFiles = fs.readdirSync(logDir);
      const recentLogs = logFiles.filter(file => {
        const stats = fs.statSync(path.join(logDir, file));
        return Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000; // 24 hours
      });

      if (recentLogs.length > 0) {
        this.addResult('logs', 'healthy', `${recentLogs.length} recent log files found`);
      } else {
        this.addResult('logs', 'warning', 'No recent log files found');
      }
    } catch (error) {
      this.addResult('logs', 'unhealthy', `Log check failed: ${error.message}`);
    }
  }

  async checkPM2() {
    console.log('🔄 Checking PM2 processes...');
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const { stdout } = await execAsync('pm2 list --json');
      const pm2Data = JSON.parse(stdout);

      const appProcess = pm2Data.find(proc => proc.name === 'arad-billboards');
      
      if (appProcess && appProcess.status === 'online') {
        this.addResult('pm2', 'healthy', `PM2 process running (${appProcess.uptime})`);
      } else {
        this.addResult('pm2', 'unhealthy', 'PM2 process not running');
      }
    } catch (error) {
      this.addResult('pm2', 'unhealthy', `PM2 check failed: ${error.message}`);
    }
  }

  addResult(check, status, message) {
    this.results.checks[check] = {
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.summary.total++;
    if (status === 'healthy') {
      this.results.summary.passed++;
    } else if (status === 'warning') {
      this.results.summary.warnings++;
    } else {
      this.results.summary.failed++;
    }
  }

  calculateOverallHealth() {
    if (this.results.summary.failed > 0) {
      this.results.overall = 'unhealthy';
    } else if (this.results.summary.warnings > 0) {
      this.results.overall = 'warning';
    } else {
      this.results.overall = 'healthy';
    }
  }

  displayResults() {
    console.log('\n📊 Health Check Results');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${this.getStatusIcon(this.results.overall)} ${this.results.overall.toUpperCase()}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('');

    Object.entries(this.results.checks).forEach(([check, result]) => {
      console.log(`${this.getStatusIcon(result.status)} ${check.toUpperCase()}: ${result.message}`);
    });

    console.log('');
    console.log('📈 Summary:');
    console.log(`   Total Checks: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Warnings: ${this.results.summary.warnings}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
  }

  getStatusIcon(status) {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  }

  async saveResults() {
    try {
      const resultsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const filename = `health-check-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(resultsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not save health check results:', error.message);
    }
  }

  makeRequest(method, url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        method,
        timeout: 5000,
        ...options
      };

      if (!url.startsWith('http')) {
        requestOptions.hostname = 'localhost';
        requestOptions.port = process.env.PORT || 3000;
        requestOptions.path = url;
      } else {
        requestOptions.hostname = new URL(url).hostname;
        requestOptions.port = new URL(url).port || (isHttps ? 443 : 80);
        requestOptions.path = new URL(url).pathname + new URL(url).search;
      }

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async getDiskUsage() {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    const { stdout } = await execAsync('df -h /');
    const lines = stdout.trim().split('\n');
    const data = lines[1].split(/\s+/);
    
    return {
      total: this.parseSize(data[1]),
      used: this.parseSize(data[2]),
      available: this.parseSize(data[3])
    };
  }

  parseSize(sizeStr) {
    const units = { K: 1024, M: 1024**2, G: 1024**3, T: 1024**4 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMGTP])/);
    if (match) {
      return parseFloat(match[1]) * units[match[2]];
    }
    return 0;
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.runAllChecks();
}

module.exports = HealthChecker;



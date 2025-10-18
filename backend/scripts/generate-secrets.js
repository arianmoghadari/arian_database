#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Generates a cryptographically secure JWT secret for production use
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // Generate 64 bytes (512 bits) of random data
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('='.repeat(80));
  console.log('🔐 JWT SECRET GENERATOR');
  console.log('='.repeat(80));
  console.log('');
  console.log('Generated secure JWT secret:');
  console.log('');
  console.log(secret);
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Copy the secret above');
  console.log('2. Add it to your .env file: JWT_SECRET=' + secret);
  console.log('3. Keep this secret secure and never share it publicly');
  console.log('4. Use different secrets for development and production');
  console.log('');
  console.log('⚠️  Security Notes:');
  console.log('- This secret is 512 bits long (very secure)');
  console.log('- Store it securely in your environment variables');
  console.log('- Never commit secrets to version control');
  console.log('- Rotate secrets periodically in production');
  console.log('');
  console.log('='.repeat(80));
  
  return secret;
}

// Generate session secret as well
function generateSessionSecret() {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log('Session secret: ' + secret);
  return secret;
}

if (require.main === module) {
  generateJWTSecret();
  console.log('');
  console.log('Additional session secret:');
  generateSessionSecret();
}

module.exports = { generateJWTSecret, generateSessionSecret };



#!/usr/bin/env node

/**
 * Environment Validation Script
 *
 * This script validates that all required environment variables are set
 * and provides helpful error messages if any are missing.
 */

const path = require('path')
const fs = require('fs')

// Required environment variables for frontend
const REQUIRED_FRONTEND_VARS = ['VITE_API_BASE_URL', 'VITE_TURNSTILE_SITE_KEY']

// Optional environment variables with defaults
const OPTIONAL_FRONTEND_VARS = {
  VITE_API_TIMEOUT: '30000',
  VITE_APP_TITLE: 'R2 File Share',
  VITE_MAX_FILE_SIZE: '100000000',
  VITE_ALLOWED_FILE_TYPES: '*',
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const env = {}

  content.split('\n').forEach((line) => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    }
  })

  return env
}

function validateFrontendEnv() {
  console.log('🔍 Validating Frontend Environment Variables...\n')

  const envPath = path.join(__dirname, '.env')
  const examplePath = path.join(__dirname, '.env.example')

  if (!fs.existsSync(envPath)) {
    console.error('❌ Missing .env file!')
    console.log('💡 Copy .env.example to .env and configure your variables:')
    console.log('   cp .env.example .env')
    return false
  }

  const env = loadEnvFile(envPath)
  const example = loadEnvFile(examplePath)

  let isValid = true

  // Check required variables
  REQUIRED_FRONTEND_VARS.forEach((varName) => {
    if (!env[varName] || env[varName] === example[varName]) {
      console.error(`❌ Missing or default value for: ${varName}`)
      console.log(`   Current: ${env[varName] || 'undefined'}`)
      console.log(`   Example: ${example[varName] || 'not set'}`)
      isValid = false
    } else {
      console.log(`✅ ${varName}: ${env[varName]}`)
    }
  })

  // Check optional variables
  Object.entries(OPTIONAL_FRONTEND_VARS).forEach(([varName, defaultValue]) => {
    const value = env[varName] || defaultValue
    console.log(`ℹ️  ${varName}: ${value} ${env[varName] ? '' : '(default)'}`)
  })

  return isValid
}

function validateBackendEnv() {
  console.log('\n🔍 Validating Backend Environment Variables...\n')

  const backendPath = path.join(__dirname, '..', 'worker-gateway')
  const devVarsPath = path.join(backendPath, '.dev.vars')
  const wranglerPath = path.join(backendPath, 'wrangler.jsonc')

  let isValid = true

  if (!fs.existsSync(devVarsPath)) {
    console.error('❌ Missing .dev.vars file in worker-gateway!')
    console.log('💡 Create .dev.vars from the example:')
    console.log('   cd worker-gateway')
    console.log('   cp .env.example .dev.vars')
    isValid = false
  } else {
    const devVars = loadEnvFile(devVarsPath)

    if (!devVars.JWT_SECRET || devVars.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET is missing or too short (minimum 32 characters)')
      isValid = false
    } else {
      console.log('✅ JWT_SECRET: configured')
    }

    if (!devVars.CORS_ORIGIN) {
      console.error('❌ CORS_ORIGIN is missing')
      isValid = false
    } else {
      console.log(`✅ CORS_ORIGIN: ${devVars.CORS_ORIGIN}`)
    }
  }

  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ Missing wrangler.jsonc file in worker-gateway!')
    console.log('💡 Create wrangler.jsonc from the example:')
    console.log('   cd worker-gateway')
    console.log('   cp wrangler.jsonc.example wrangler.jsonc')
    isValid = false
  } else {
    console.log('✅ wrangler.jsonc: exists')
  }

  return isValid
}

function main() {
  console.log('🚀 R2 File Share Environment Validation\n')

  const frontendValid = validateFrontendEnv()
  const backendValid = validateBackendEnv()

  console.log('\n📊 Validation Summary:')
  console.log(`Frontend: ${frontendValid ? '✅ Valid' : '❌ Invalid'}`)
  console.log(`Backend: ${backendValid ? '✅ Valid' : '❌ Invalid'}`)

  if (frontendValid && backendValid) {
    console.log('\n🎉 All environment variables are properly configured!')
    console.log('You can now run: npm run dev')
  } else {
    console.log('\n⚠️  Please fix the issues above before continuing.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

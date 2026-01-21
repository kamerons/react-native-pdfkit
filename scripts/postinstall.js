#!/usr/bin/env node

/**
 * Postinstall script that builds the package if needed.
 * Handles cases where dependencies might not be installed yet.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '..', 'js');
const BUILD_FILES = [
  path.join(BUILD_DIR, 'pdfkit.js'),
  path.join(BUILD_DIR, 'pdfkit.es.js'),
  path.join(BUILD_DIR, 'virtual-fs.js'),
];

function checkDependencies() {
  const rollupPath = path.join(__dirname, '..', 'node_modules', '.bin', 'rollup');

  // Check if rollup exists in node_modules/.bin
  if (fs.existsSync(rollupPath)) {
    try {
      execSync(`"${rollupPath}" --version`, { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  // Fallback: check if rollup is available globally or via npx
  try {
    execSync('rollup --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    // Try npx as last resort
    try {
      execSync('npx rollup --version', { stdio: 'ignore' });
      return true;
    } catch (e2) {
      return false;
    }
  }
}

function buildFilesExist() {
  return BUILD_FILES.every(file => {
    try {
      return fs.existsSync(file) && fs.statSync(file).size > 0;
    } catch (e) {
      return false;
    }
  });
}

function runBuild() {
  try {
    console.log('Building pdfkit...');
    const rollupPath = path.join(__dirname, '..', 'node_modules', '.bin', 'rollup');
    const rollupCmd = fs.existsSync(rollupPath)
      ? `"${rollupPath}"`
      : 'rollup';

    execSync(`${rollupCmd} -c`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('Build completed successfully.');
    return true;
  } catch (e) {
    console.error('Build failed:', e.message);
    return false;
  }
}

// Main execution
if (buildFilesExist()) {
  console.log('Build files already exist, skipping build.');
  process.exit(0);
}

if (!checkDependencies()) {
  console.warn(
    'Warning: rollup not found. Build dependencies may not be installed yet.\n' +
    'The package will still work, but you may need to run "yarn build" or "npm run build" manually.\n' +
    'This is normal when installing as a file dependency.'
  );
  process.exit(0);
}

if (!runBuild()) {
  console.error(
    'Build failed. The package may still work if build files exist from a previous build.\n' +
    'Try running "yarn build" or "npm run build" manually.'
  );
  process.exit(1);
}

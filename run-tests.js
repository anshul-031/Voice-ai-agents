#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Voice AI Chat Agent
 * 
 * This script runs all available test suites:
 * 1. API tests - checks API endpoints individually
 * 2. End-to-end tests - tests the full processing pipeline
 * 3. UI tests - validates component rendering
 * 
 * Run with: node run-tests.js
 * 
 * Options:
 *   --api-only: Run only API tests
 *   --e2e-only: Run only end-to-end tests
 *   --ui-only: Run only UI component tests
 *   --skip-ui: Skip UI tests
 */

const { spawn } = require('child_process');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
};

// Test configuration
const TEST_TIMEOUT = 120000; // 2 minutes timeout for each test suite

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    apiOnly: args.includes('--api-only'),
    e2eOnly: args.includes('--e2e-only'),
    uiOnly: args.includes('--ui-only'),
    skipUi: args.includes('--skip-ui'),
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function runTest(testScript, label) {
    return new Promise((resolve) => {
        log(`\n${colors.bold}${colors.blue}Running ${label}...${colors.reset}\n`);

        const startTime = Date.now();
        const test = spawn('node', [path.join(__dirname, testScript)], {
            stdio: 'inherit',
        });

        // Set timeout to prevent hanging tests
        const timeout = setTimeout(() => {
            log(`\n${colors.red}${colors.bold}Test ${label} timed out after ${TEST_TIMEOUT / 1000} seconds${colors.reset}`, colors.red);
            test.kill('SIGTERM');
            resolve({ exitCode: 124, name: label, duration: Date.now() - startTime });
        }, TEST_TIMEOUT);

        test.on('close', (exitCode) => {
            clearTimeout(timeout);
            const duration = Date.now() - startTime;
            log(`\n${colors.bold}${exitCode === 0 ? colors.green : colors.red}${label} completed with exit code ${exitCode} (${duration / 1000}s)${colors.reset}`);
            resolve({ exitCode, name: label, duration });
        });
    });
}

async function runAllTests() {
    log('='.repeat(70), colors.blue);
    log(`${colors.bold}🧪 Voice AI Chat Agent - Comprehensive Test Suite${colors.reset}`, colors.blue);
    log('='.repeat(70), colors.blue);

    const results = [];

    // Determine which tests to run based on options
    const testsToRun = [];

    if (options.apiOnly) {
        testsToRun.push({ script: 'test-api.js', label: 'API Tests' });
    } else if (options.e2eOnly) {
        testsToRun.push({ script: 'test-e2e-enhanced.js', label: 'Enhanced End-to-End Tests' });
    } else if (options.uiOnly) {
        testsToRun.push({ script: 'test-ui.js', label: 'UI Component Tests' });
    } else {
        // Run all tests
        testsToRun.push({ script: 'test-api.js', label: 'API Tests' });
        testsToRun.push({ script: 'test-e2e-enhanced.js', label: 'Enhanced End-to-End Tests' });

        if (!options.skipUi) {
            testsToRun.push({ script: 'test-ui.js', label: 'UI Component Tests' });
        }
    }

    // Run each test sequentially
    for (const test of testsToRun) {
        const result = await runTest(test.script, test.label);
        results.push(result);
    }

    // Print final summary
    log('\n' + '='.repeat(70), colors.blue);
    log(`${colors.bold}📊 Test Suite Summary${colors.reset}`, colors.blue);
    log('='.repeat(70), colors.blue);

    results.forEach(result => {
        const status = result.exitCode === 0 ? `${colors.green}PASSED` : `${colors.red}FAILED (${result.exitCode})`;
        log(`${result.name.padEnd(30, ' ')}: ${status}${colors.reset} (${(result.duration / 1000).toFixed(1)}s)`);
    });

    const passedCount = results.filter(r => r.exitCode === 0).length;
    const totalCount = results.length;

    log(`\n${passedCount} of ${totalCount} test suites passed`,
        passedCount === totalCount ? colors.green :
            passedCount > 0 ? colors.yellow : colors.red);

    if (passedCount === totalCount) {
        log(`\n${colors.green}${colors.bold}🎉 All tests passed! Your Voice AI Chat Agent is working correctly.${colors.reset}`);
        return 0;
    } else {
        log(`\n${colors.yellow}${colors.bold}⚠️ Some tests failed. See details above.${colors.reset}`);
        return 1;
    }
}

// Run tests
runAllTests()
    .then(exitCode => {
        process.exit(exitCode);
    })
    .catch(error => {
        log(`\n${colors.red}${colors.bold}❌ Fatal error running tests: ${error.message}${colors.reset}`, colors.red);
        console.error(error);
        process.exit(2);
    });
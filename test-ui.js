/**
 * UI Component Validation for Voice AI Chat Agent
 * 
 * This script checks that all UI components are rendering properly
 * by accessing the application URL and evaluating DOM elements.
 * 
 * Run with: node test-ui.js
 * 
 * Requirements: 
 * - Install puppeteer: npm install puppeteer
 */

const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function testUI() {
    log('='.repeat(60), colors.blue);
    log('🧪 Voice AI Chat Agent - UI Component Test', colors.blue);
    log('='.repeat(60), colors.blue);

    let browser;
    try {
        log('\n🔍 Starting browser for UI testing...', colors.blue);
        browser = await puppeteer.launch({
            headless: 'new', // Use the new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        log(`📱 Navigating to ${BASE_URL}...`, colors.blue);

        await page.goto(BASE_URL, {
            waitUntil: 'networkidle2',
            timeout: TIMEOUT
        });

        log('✅ Page loaded successfully', colors.green);

        // Test results for each component
        const results = {
            header: false,
            modelBoxes: false,
            promptEditor: false,
            micButton: false,
            chatBox: false
        };

        // 1. Check Header
        log('\n🔷 Testing Header Component', colors.blue);
        try {
            const headerText = await page.$eval('h1', el => el.textContent);
            log(`Found header: "${headerText}"`, colors.cyan);
            results.header = true;
            log('✅ Header component rendered correctly', colors.green);
        } catch (error) {
            log(`❌ Header component test failed: ${error.message}`, colors.red);
        }

        // 2. Check Model Boxes
        log('\n🔷 Testing Model Boxes Component', colors.blue);
        try {
            const modelTypes = await page.$$eval('div:has(h3)', elements =>
                elements.filter(el => ['LLM', 'STT', 'TTS'].includes(el.querySelector('h3')?.textContent))
                    .map(el => el.querySelector('h3').textContent)
            );

            if (modelTypes.length >= 3) {
                log(`Found ${modelTypes.length} model type boxes: ${modelTypes.join(', ')}`, colors.cyan);
                results.modelBoxes = true;
                log('✅ Model Boxes component rendered correctly', colors.green);
            } else {
                log(`❌ Expected 3 model boxes, found ${modelTypes.length}`, colors.red);
            }
        } catch (error) {
            log(`❌ Model Boxes component test failed: ${error.message}`, colors.red);
        }

        // 3. Check System Prompt Editor
        log('\n🔷 Testing System Prompt Editor Component', colors.blue);
        try {
            const textarea = await page.$('textarea');
            if (textarea) {
                const promptValue = await page.evaluate(el => el.value, textarea);
                log(`Found prompt editor with value: "${promptValue.substring(0, 30)}${promptValue.length > 30 ? '...' : ''}"`, colors.cyan);

                // Test editing the textarea
                await textarea.type(' This is a test.');
                const newValue = await page.evaluate(el => el.value, textarea);

                if (newValue.endsWith('This is a test.')) {
                    results.promptEditor = true;
                    log('✅ System Prompt Editor component rendered and editable', colors.green);
                } else {
                    log('❌ System Prompt Editor not properly editable', colors.red);
                }
            } else {
                log('❌ System Prompt Editor textarea not found', colors.red);
            }
        } catch (error) {
            log(`❌ System Prompt Editor component test failed: ${error.message}`, colors.red);
        }

        // 4. Check Mic Button
        log('\n🔷 Testing Mic Button Component', colors.blue);
        try {
            const micButton = await page.$('button:has(svg)');
            if (micButton) {
                log('Found microphone button', colors.cyan);

                // Click the button to start listening
                log('Clicking mic button to test interaction...', colors.cyan);
                await micButton.click();
                await page.waitForTimeout(1000);

                // Check if listening status is shown
                const listeningStatus = await page.evaluate(() => {
                    const statusElements = Array.from(document.querySelectorAll('span, div, p'));
                    return statusElements.some(el => el.textContent?.toLowerCase().includes('listening'));
                });

                if (listeningStatus) {
                    results.micButton = true;
                    log('✅ Mic Button component rendered and interactive', colors.green);

                    // Click again to stop listening
                    await micButton.click();
                    await page.waitForTimeout(1000);
                } else {
                    log('❌ Mic Button clicked but listening status not found', colors.red);
                }
            } else {
                log('❌ Mic Button not found', colors.red);
            }
        } catch (error) {
            log(`❌ Mic Button component test failed: ${error.message}`, colors.red);
        }

        // 5. Check Chat Box
        log('\n🔷 Testing Chat Box Component', colors.blue);
        try {
            // Check if chat box container exists
            const chatBoxExists = await page.evaluate(() => {
                // Look for elements that likely represent the chat container
                return Boolean(
                    document.querySelector('div.h-\\[600px\\]') || // Match the class from our page.tsx
                    document.querySelector('div.h-\\[500px\\]') ||
                    document.querySelector('div:has(> div.overflow-y-auto)') || // Common chat UI pattern
                    document.querySelector('div:has(div:has(div.flex-1))') // Chat container structure
                );
            });

            if (chatBoxExists) {
                log('Found chat box container', colors.cyan);
                results.chatBox = true;
                log('✅ Chat Box component rendered correctly', colors.green);
            } else {
                log('❌ Chat Box container not found', colors.red);
            }
        } catch (error) {
            log(`❌ Chat Box component test failed: ${error.message}`, colors.red);
        }

        // Final summary
        log('\n' + '='.repeat(60), colors.blue);
        log('📊 UI Component Test Results', colors.blue);
        log('='.repeat(60), colors.blue);

        Object.entries(results).forEach(([component, passed]) => {
            const icon = passed ? '✅' : '❌';
            const textColor = passed ? colors.green : colors.red;
            const formattedName = component
                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                .replace(/^./, str => str.toUpperCase()); // Capitalize first letter

            log(`${icon} ${formattedName.padEnd(20, ' ')}: ${passed ? 'PASSED' : 'FAILED'}`, textColor);
        });

        const passedCount = Object.values(results).filter(Boolean).length;
        const totalCount = Object.values(results).length;

        log(`\n${passedCount} of ${totalCount} UI components passed tests`,
            passedCount === totalCount ? colors.green :
                passedCount > 0 ? colors.yellow : colors.red);

        if (passedCount === totalCount) {
            log('\n🎉 All UI components are rendering correctly!', colors.green);
            return 0; // Success exit code
        } else if (passedCount > 0) {
            log('\n⚠️ Some UI components failed to render correctly. See details above.', colors.yellow);
            return 1; // Warning exit code
        } else {
            log('\n❌ All UI components failed! Please check your implementation.', colors.red);
            return 2; // Error exit code
        }
    } catch (error) {
        log(`\n❌ Fatal error during UI testing: ${error.message}`, colors.red);
        console.error(error);
        return 3; // Critical error exit code
    } finally {
        if (browser) {
            log('\n🔒 Closing browser...', colors.blue);
            await browser.close();
        }
    }
}

// Run the test
testUI()
    .then(exitCode => {
        process.exit(exitCode);
    })
    .catch(error => {
        log(`\n❌ Unhandled error: ${error.message}`, colors.red);
        console.error(error);
        process.exit(3);
    });
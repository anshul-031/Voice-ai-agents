/**
 * Voice AI Chat Agent - UI Component Test
 * 
 * This script tests that the UI components are correctly structured.
 * It doesn't rely on a running application or API endpoints.
 */

const fs = require('fs');
const path = require('path');

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

// Test configuration
const componentsDir = path.join(__dirname, 'components');
const mainPage = path.join(__dirname, 'app', 'page.tsx');

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        return null;
    }
}

function checkComponentForProps(content, propNames) {
    if (!content) return false;

    // Check for interface declaration with props
    const interfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/s);
    if (!interfaceMatch) return false;

    // Count props found in the interface
    const propsFound = propNames.filter(prop =>
        interfaceMatch[1].includes(prop)
    );

    return propsFound.length === propNames.length;
}

function testUIComponents() {
    log('='.repeat(60), colors.blue);
    log('🧪 Voice AI Chat Agent - UI Component Structure Test', colors.blue);
    log('='.repeat(60), colors.blue);

    const results = {};

    // Test 1: Check that all component files exist
    const requiredComponents = [
        'MicButton.tsx',
        'ChatBox.tsx',
        'TopModelBoxes.tsx',
        'InitialPromptEditor.tsx'
    ];

    log('\n📋 Checking required component files...', colors.blue);

    for (const component of requiredComponents) {
        const filePath = path.join(componentsDir, component);
        const exists = checkFileExists(filePath);

        results[component] = { exists };

        if (exists) {
            log(`✅ ${component} exists`, colors.green);
        } else {
            log(`❌ ${component} not found`, colors.red);
        }
    }

    // Test 2: Check components have the right props
    log('\n📋 Checking component props...', colors.blue);

    // Expected props for each component
    const expectedProps = {
        'MicButton.tsx': ['isListening', 'isOpen', 'onToggle'],
        'ChatBox.tsx': ['messages', 'isOpen', 'isListening', 'isProcessing'],
        'TopModelBoxes.tsx': ['config'],
        'InitialPromptEditor.tsx': ['value', 'onChange'],
    };

    for (const component of requiredComponents) {
        if (!results[component].exists) continue;

        const filePath = path.join(componentsDir, component);
        const content = readFileContent(filePath);
        const props = expectedProps[component] || [];
        const hasProps = checkComponentForProps(content, props);

        results[component].hasCorrectProps = hasProps;

        if (hasProps) {
            log(`✅ ${component} has the expected props: ${props.join(', ')}`, colors.green);
        } else {
            log(`❌ ${component} is missing some expected props: ${props.join(', ')}`, colors.red);
        }
    }

    // Test 3: Check main page imports all components
    log('\n📋 Checking main page imports...', colors.blue);

    const mainPageContent = readFileContent(mainPage);
    const importResults = {};

    if (mainPageContent) {
        for (const component of requiredComponents) {
            const componentName = path.basename(component, '.tsx');
            const hasImport = mainPageContent.includes(`import ${componentName} from`);
            importResults[componentName] = hasImport;

            if (hasImport) {
                log(`✅ ${componentName} is imported in main page`, colors.green);
            } else {
                log(`❌ ${componentName} import not found in main page`, colors.red);
            }
        }
    } else {
        log(`❌ Could not read main page content`, colors.red);
    }

    // Final summary
    log('\n' + '='.repeat(60), colors.blue);
    log('📊 UI Component Structure Test Summary', colors.blue);
    log('='.repeat(60), colors.blue);

    // Component checks
    let totalChecks = 0;
    let passedChecks = 0;

    for (const component of requiredComponents) {
        const r = results[component];
        totalChecks += 2; // exists + props check
        passedChecks += (r.exists ? 1 : 0) + (r.hasCorrectProps ? 1 : 0);
    }

    // Import checks
    for (const importResult of Object.values(importResults)) {
        totalChecks++;
        if (importResult) passedChecks++;
    }

    log(`Component files: ${Object.values(results).filter(r => r.exists).length}/${requiredComponents.length}`, colors.cyan);
    log(`Correct props: ${Object.values(results).filter(r => r.hasCorrectProps).length}/${requiredComponents.length}`, colors.cyan);
    log(`Main page imports: ${Object.values(importResults).filter(i => i).length}/${requiredComponents.length}`, colors.cyan);
    log(`\nTotal checks passed: ${passedChecks}/${totalChecks}`, colors.cyan);

    if (passedChecks === totalChecks) {
        log('\n🎉 All UI component structure checks passed!', colors.green);
        return 0;
    } else {
        log('\n⚠️ Some UI component structure checks failed.', colors.yellow);
        return 1;
    }
}

// Run the tests
try {
    const exitCode = testUIComponents();
    process.exit(exitCode);
} catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(2);
}
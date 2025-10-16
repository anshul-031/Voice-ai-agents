#!/usr/bin/env node
/**
 * Simple coverage gate for CI. Reads coverage/coverage-summary.json (or coverage-final.json)
 * and enforces a minimum global coverage percentage for lines, functions, branches, and statements.
 *
 * Usage: node scripts/check-coverage.js [threshold]
 * Default threshold is 90.
 */

const fs = require('fs');
const path = require('path');

const threshold = Number(process.argv[2] || 90);

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const root = process.cwd();
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
const fallbackPath = path.join(root, 'coverage', 'coverage-final.json');

const data = readJson(summaryPath) || readJson(fallbackPath);

if (!data) {
  console.error('Coverage summary not found. Expected coverage/coverage-summary.json or coverage/coverage-final.json');
  process.exit(2);
}

// jest json-summary format may nest totals under 'total' or be a flat map for coverage-final
const totals = data.total || data;
const metrics = {
  lines: totals.lines?.pct,
  statements: totals.statements?.pct,
  functions: totals.functions?.pct,
  branches: totals.branches?.pct,
};

const failed = Object.entries(metrics)
  .filter(([, pct]) => typeof pct === 'number' && pct < threshold);

if (failed.length > 0) {
  console.error(`Coverage check failed. Minimum required: ${threshold}%`);
  for (const [k, pct] of failed) {
    console.error(` - ${k}: ${pct}%`);
  }
  process.exit(1);
}

console.log(`Coverage check passed. All metrics >= ${threshold}%`);

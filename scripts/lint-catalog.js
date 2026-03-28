#!/usr/bin/env node
// Lint script for argus-mcp-catalog
// Validates catalog.json and all listed YAML files against D-16 requirements.
// Usage: npm install js-yaml && node scripts/lint-catalog.js
// Exit code: 0 if all checks pass, 1 if any violations found.

'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'catalog.json');
const CONFIGS_DIR = path.join(ROOT, 'configs');

const errors = [];

function addError(msg) {
  errors.push(msg);
  console.error('  ERROR:', msg);
}

// 1. Validate catalog.json
console.log('Checking catalog.json...');
let catalog;
try {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  catalog = JSON.parse(raw);
} catch (e) {
  console.error('FATAL: catalog.json is not valid JSON:', e.message);
  process.exit(1);
}

if (!catalog.categories || typeof catalog.categories !== 'object') {
  console.error('FATAL: catalog.json missing "categories" object');
  process.exit(1);
}
if (!catalog.updated_at || typeof catalog.updated_at !== 'string') {
  addError('catalog.json missing "updated_at" string field');
}

// 2. For each category and file, validate existence and YAML structure
const categories = catalog.categories;
let totalFiles = 0;

for (const [category, filenames] of Object.entries(categories)) {
  if (!Array.isArray(filenames) || filenames.length === 0) {
    addError(`Category "${category}" has no files listed in catalog.json`);
    continue;
  }

  for (const filename of filenames) {
    totalFiles++;
    const filePath = path.join(CONFIGS_DIR, category, filename);

    // Check file exists
    if (!fs.existsSync(filePath)) {
      addError(`File listed in catalog.json does not exist: configs/${category}/${filename}`);
      continue;
    }

    // Parse as YAML
    let parsed;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      parsed = yaml.load(content);
    } catch (e) {
      addError(`YAML parse error in configs/${category}/${filename}: ${e.message}`);
      continue;
    }

    if (!parsed || typeof parsed !== 'object') {
      addError(`configs/${category}/${filename}: YAML parsed to non-object`);
      continue;
    }

    // Check top-level name: is a non-empty string
    if (typeof parsed.name !== 'string' || parsed.name.trim() === '') {
      addError(`configs/${category}/${filename}: missing or empty top-level "name:" string`);
    }

    // Check top-level description: is a non-empty string
    if (typeof parsed.description !== 'string' || parsed.description.trim() === '') {
      addError(`configs/${category}/${filename}: missing or empty top-level "description:" string`);
    }

    // Check at least one backend-slug key exists (besides name and description)
    const reserved = new Set(['name', 'description']);
    const backendKeys = Object.keys(parsed).filter(k => !reserved.has(k));
    if (backendKeys.length === 0) {
      addError(`configs/${category}/${filename}: no backend-slug key found (expected at least one key besides name and description)`);
    }
  }
}

console.log(`Checked ${totalFiles} files across ${Object.keys(categories).length} categories.`);

if (errors.length > 0) {
  console.error(`\nLint failed with ${errors.length} error(s). See above.`);
  process.exit(1);
} else {
  console.log('All checks passed.');
  process.exit(0);
}

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'SysProbe-Pro');

const directories = [
  'src/commands',
  'src/core',
  'src/services',
  'src/analyzers',
  'src/reports',
  'src/templates',
  'src/utils',
  'src/validators',
  'src/config',
  'src/constants',
  'src/types',
  'src/middleware',
  'src/errors',
  'assets',
  'logs',
  'reports',
  'tests',
  'docs',
  '.github',
  '.vscode'
];

const filesToCreate = [
  { path: 'src/index.js', purpose: 'Application entry point', resp: 'Bootstraps the application, initializes core components.', future: 'Add clustering support.' },
  { path: 'src/cli.js', purpose: 'Command Line Interface definition', resp: 'Parses command line arguments, sets up commands.', future: 'Add interactive wizard mode.' },
  { path: 'src/core/system.js', purpose: 'System Information Gathering', resp: 'Collects OS, CPU, memory, and network details safely.', future: 'Add detailed hardware sensor reading.' },
  { path: 'src/core/environment.js', purpose: 'Environment Variable Management', resp: 'Safely reads and filters environment variables.', future: 'Support loading custom .env files.' },
  { path: 'src/services/crud.js', purpose: 'File System Operations', resp: 'Handles safe CRUD operations in allowed directories.', future: 'Add bulk operation support.' },
  { path: 'src/analyzers/scanner.js', purpose: 'Directory and File Scanning', resp: 'Scans selected directories for analysis.', future: 'Implement parallel scanning.' },
  { path: 'src/analyzers/analyzer.js', purpose: 'Source Code Analysis', resp: 'Analyzes files for patterns and metadata.', future: 'Integrate AST-based parsing.' },
  { path: 'src/utils/logger.js', purpose: 'Application Logging', resp: 'Provides formatted logging to console and files.', future: 'Integrate external log aggregation.' },
  { path: 'src/reports/reportGenerator.js', purpose: 'Report Orchestration', resp: 'Coordinates data collection and report creation.', future: 'Add support for PDF generation.' },
  { path: 'src/reports/htmlGenerator.js', purpose: 'HTML Report Generation', resp: 'Generates beautiful HTML reports from templates.', future: 'Add interactive charts to HTML.' },
  { path: 'src/config/config.js', purpose: 'Configuration Management', resp: 'Loads and validates application configuration.', future: 'Support remote configuration fetching.' },
  { path: 'src/constants/constants.js', purpose: 'Application Constants', resp: 'Stores reusable magic strings and numbers.', future: 'Split constants by domain.' },
  { path: 'src/errors/errors.js', purpose: 'Custom Error Definitions', resp: 'Defines specific error classes for the application.', future: 'Add error translation support.' },
  { path: 'src/validators/validator.js', purpose: 'Input Validation', resp: 'Validates user input and file paths.', future: 'Implement schema-based validation.' },
  { path: 'src/utils/helper.js', purpose: 'Utility Functions', resp: 'Provides common helper functions used across the app.', future: 'Extract to separate generic package.' },
  { path: 'README.md', content: '# SysProbe Pro\n\nA secure, professional developer utility for system information gathering, environment inspection, and project analysis.' },
  { path: 'LICENSE', content: 'MIT License' },
  { path: 'CHANGELOG.md', content: '# Changelog\n\nAll notable changes to this project will be documented in this file.' },
  { path: '.gitignore', content: 'node_modules/\nlogs/\n.env\nreports/' },
  { path: '.editorconfig', content: 'root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true' },
  { path: '.prettierrc', content: '{\n  "semi": true,\n  "trailingComma": "all",\n  "singleQuote": true,\n  "printWidth": 100\n}' },
  { path: '.eslintrc.json', content: '{\n  "env": {\n    "node": true,\n    "es2021": true\n  },\n  "extends": "eslint:recommended",\n  "parserOptions": {\n    "ecmaVersion": 12,\n    "sourceType": "module"\n  },\n  "rules": {}\n}' }
];

const packageJson = {
  name: 'sysprobe-pro',
  version: '1.0.0',
  description: 'Secure developer utility for system info, env vars, and project analysis.',
  main: 'src/index.js',
  type: 'module',
  scripts: {
    start: 'node src/index.js',
    dev: 'node --watch src/index.js',
    lint: 'eslint src/**/*.js',
    format: 'prettier --write "src/**/*.js"',
    test: 'echo "Error: no test specified" && exit 1',
    analyze: 'node src/index.js analyze',
    report: 'node src/index.js report'
  },
  author: 'THUNDER HACKATHON 3.0',
  license: 'MIT'
};

fs.mkdirSync(rootDir, { recursive: true });

directories.forEach(dir => {
  fs.mkdirSync(path.join(rootDir, dir), { recursive: true });
});

filesToCreate.forEach(file => {
  const fullPath = path.join(rootDir, file.path);
  if (file.content !== undefined) {
    fs.writeFileSync(fullPath, file.content);
  } else {
    const filename = path.basename(file.path);
    const content = `/**
 * @file ${filename}
 * @description ${file.purpose}
 * @responsibilities ${file.resp}
 * @future ${file.future}
 */

// TODO: Implement foundation logic here.
`;
    fs.writeFileSync(fullPath, content);
  }
});

fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('Project foundation created successfully.');

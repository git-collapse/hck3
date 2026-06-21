# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-21

### Added
- Environment Inspector: env command shows all vars in Unicode table
  with sensitive-key redaction and PATH duplicate detection.
- Health Command: 7 real checks replacing the previous stub.
- CRUD File Manager: Full interactive Create/Read/Update/Delete/List
  with inquirer menu, result envelopes, and auto .bak backups.
- Test Suite: 28 unit tests (system.test.js × 10, crud.test.js × 18)
  using only Node.js built-in assert. Run: npm test
- Real network speed on Linux via /proc/net/dev; Mac via netstat -ibn.

### Fixed
- system command now displays selected environment variables
  (was missing — required by spec).
- CPU progress bar was hardcoded to 100% — removed.
- Version string was hardcoded as "1.0.0" in system.js — now reads
  from package.json dynamically.
- --json flag now prints JSON to stdout (was silently doing nothing).
- system output no longer shows Node.js version twice.
- Temp directory and Process ID now shown in system output.
- crud.js, environment.js were setTimeout stubs — both replaced.
- reportGenerator.js was dead stub code — deleted.
- Network speed on Linux/Mac was hardcoded to 0 B/s — fixed.

### Changed
- .gitignore now excludes reports/, output/, logs/, *.bak
- package.json version bumped to 1.1.0

## [1.0.0] - 2026-06-20

### Added
- **Dashboard Command**: A brand new, interactive, flicker-free terminal UI modeled after `btop`, displaying real-time metrics, interactive overlay toggles (`A`, `D`, `P`, `S`), and a theming engine.
- **AI Command**: An offline, rule-based expert system that interprets telemetry into conversational, actionable developer advice without calling cloud APIs.
- **Scan Command**: A static project analyzer evaluating project types, dependencies, code quality (lint/format/CI), and basic security heuristics.
- **Report Command**: Multi-format reporting engine outputting beautiful standalone HTML files, GitHub-friendly Markdown, and machine-readable JSON.
- **Doctor Command**: System health diagnostics yielding an overall grade based on RAM, CPU, disk, and environment variables.
- **Monitor Command**: Redesigned legacy monitor to support sparklines, dynamic alerts, and an interactive CLI layout.
- **CRUD Operations**: Secure, scoped file system interaction module.
- Modern `cli.js` routing via `commander`.
- Automated startup banner and stylized custom help menus.

### Changed
- Standardized colors across all modules using a centralized `Theme` mapping.

### Removed
- Extraneous development dependencies.
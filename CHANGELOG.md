# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
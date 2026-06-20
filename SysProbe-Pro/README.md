# SysProbe Pro 🚀

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![Platform](https://img.shields.io/badge/Platform-Cross--Platform-lightgrey.svg)
![Status](https://img.shields.io/badge/Status-Stable-success.svg)

**SysProbe Pro** is a premium, professional-grade system and project diagnostic suite designed for modern developers. It runs entirely offline, aggregating your hardware telemetry, project quality metrics, and environmental data into beautiful terminal interfaces and generated reports.

No cloud. No bloated dependencies. Just fast, rule-based intelligence.

---

## 🌟 Features

- 🖥️ **Premium Dashboard (`dashboard`)**: A flicker-free, interactive terminal UI (TUI) mimicking `btop`. Monitor CPU, RAM, Disk, and Network with live sparklines and instant interactive overlays.
- 🧠 **Offline AI Advisor (`ai`)**: A rule-based expert system that translates raw hardware metrics and project data into conversational, actionable developer advice.
- 🩺 **System Doctor (`doctor`)**: Instantly evaluate your system health, environment variables, and Node.js version to get an overall grade (A+ to F).
- 📊 **Reporting Engine (`report`)**: Export beautiful, standalone HTML reports, GitHub-friendly Markdown summaries, or raw JSON data.
- 🔍 **Static Scanner (`scan`)**: Deep static analysis mapping project directories, detecting unused dependencies, measuring code quality, and scanning for exposed secrets.
- ⚡ **Cross-Platform**: Built natively on Node.js standard libraries to ensure flawless execution on Windows, macOS, and Linux without compiling C++ bindings.

---

## 📦 Installation

To use SysProbe Pro, you need [Node.js](https://nodejs.org/) installed (v18+ recommended).

Clone the repository and install the minimal dependencies:

```bash
git clone https://github.com/your-username/sysprobe-pro.git
cd sysprobe-pro
npm install
```

---

## 🚀 Usage

SysProbe Pro acts as a robust CLI router. Start the tool using `npm start -- <command>`.

### The Premium Dashboard
Launch the interactive monitoring dashboard with live toggles:
```bash
npm start -- dashboard
```
> **Hotkeys**:
> - `[A]` Toggle AI Advisor Overlay
> - `[D]` Toggle Doctor Overlay
> - `[S]` Toggle Scan Summary
> - `[T]` Toggle Dark/Light Theme
> - `[Q]` Quit

### Offline AI Advisor
Get conversational advice on your local system state:
```bash
npm start -- ai
```

### Static Project Scanner
Analyze your current directory for security risks and code quality:
```bash
npm start -- scan
```

### Export Beautiful Reports
Generate an offline HTML diagnostic report:
```bash
npm start -- report --html
```

### Other Commands
```bash
npm start -- monitor  # Launch legacy monitor widget
npm start -- doctor   # Run immediate health check
npm start -- env      # Inspect safe environment variables
npm start -- system   # Output raw system hardware JSON
```

---

## 🏗️ Architecture

SysProbe Pro is built with a strictly decoupled architecture:
1. **Core Utilities**: `src/services/` fetches low-level OS telemetry safely.
2. **Analysis Engines**: `src/analyzers/` and `src/advisor/` compute heuristics and scores without touching the CLI.
3. **Display Layer**: `src/dashboard/` and `src/monitor/` use native `readline` and ANSI escapes for flicker-free rendering.
4. **CLI Router**: `src/cli.js` acts solely to parse input and lazy-load the appropriate command modules.

---

## 🗺️ Roadmap

- [x] Initial Beta Release
- [x] Cross-platform flicker-free TUI
- [x] Offline AI rule-based engine
- [x] HTML & Markdown Reporting
- [ ] Network traffic deep-packet inspection module
- [ ] Containerized Docker health checks

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out our [Contributing Guidelines](CONTRIBUTING.md).

---

## 📝 License

This project is [MIT](LICENSE) licensed.
<div align="center">

# SysProbe Pro 🚀

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![Platform](https://img.shields.io/badge/Platform-Cross--Platform-lightgrey.svg)
![Status](https://img.shields.io/badge/Status-Stable-success.svg)
![Dependencies](https://img.shields.io/badge/Dependencies-Minimal-orange.svg)

**A professional, offline, and secure developer diagnostic suite.**  
SysProbe Pro transforms your local telemetry and project metadata into beautifully rendered terminal dashboards, automated system doctor reports, and actionable AI-driven advice—all without relying on cloud APIs or bloated native modules.

</div>

---

## 🌟 Features

SysProbe Pro is packed with powerful modules designed for performance, security, and developer ergonomics:

| Feature                   | Description                                                                           |
| :------------------------ | :------------------------------------------------------------------------------------ |
| **System Information**    | Gathers comprehensive OS, Node.js, network, CPU, and memory telemetry.                |
| **Environment Analysis**  | Inspects local variables and critical environment setups safely.                      |
| **CRUD Operations**       | A sandboxed filesystem manager built directly into the CLI.                           |
| **Project Scanner**       | Traverses local repositories to identify project types, sizes, and file metadata.     |
| **AI Advisor**            | A deterministic, offline rules-engine translating raw telemetry into actionable text. |
| **Doctor Diagnostics**    | Heuristic evaluation of your system yielding a Health Grade (A+ to F).                |
| **Live Monitor**          | Real-time CLI performance tracker with historical sparklines.                         |
| **Interactive Dashboard** | A flicker-free, `btop`-style full-screen UI with dynamic overlays.                    |
| **Professional Reports**  | Builder patterns to export data beautifully to your hard drive.                       |
| **JSON Export**           | Machine-readable outputs for CI/CD ingestion.                                         |
| **HTML Export**           | Standalone, visually stunning offline browser reports.                                |
| **Markdown Export**       | GitHub-friendly snapshots of your system state.                                       |
| **Health Score**          | Aggregated telemetry converted into a readable metric out of 100.                     |
| **Security Analysis**     | Static identification of hardcoded secrets or unencrypted keys in source code.        |
| **Recommendations**       | Context-aware suggestions targeting memory overload, unformatted code, etc.           |

---

## 🏗️ Architecture

The application operates on a strict separation of concerns, decoupling the command-line interface from the underlying business logic. This ensures that any module can be tested, extended, or reused independently.

### Folder Structure

```text
sysprobe-pro/
├── package.json
├── src/
│   ├── index.js            # Global bootstrap and uncaught error handling
│   ├── cli.js              # Command registration and router logic
│   ├── advisor/            # Offline AI heuristics and intelligence engine
│   ├── analyzers/          # Static code, dependency, and security analysis
│   ├── core/               # Standard system and environment diagnostics
│   ├── dashboard/          # Interactive, flicker-free terminal dashboard UI
│   ├── monitor/            # Live telemetry polling and historical tracking
│   ├── reports/            # Multi-format report builder (HTML, MD, JSON)
│   ├── services/           # Low-level OS data gathering (hardware, crud)
│   └── utils/              # Reusable tools (logger, theme, formatter)
```

### Responsibilities

- **`services/`**: The pure data layer. Fetches hardware specs and OS metrics.
- **`analyzers/` & `advisor/`**: The brain layer. Processes raw data into heuristics.
- **`dashboard/` & `monitor/`**: The presentation layer. Paints raw data into the terminal buffer.
- **`reports/`**: The export layer. Formats data for external consumption.

---

## 🔄 Code Flow (The Execution Pipeline)

Understanding how SysProbe Pro executes a request is critical to maintaining the project's robust architecture. Every command follows this deterministic, unidirectional pipeline:

1. **User runs command**  
   The user triggers the application via the terminal (e.g., `npm start -- dashboard`).

   **↓**

2. **CLI parses command**  
   `src/index.js` bootstraps the app, displays the initial branding banner, and passes standard input arguments to `src/cli.js`.

   **↓**

3. **Command router**  
   `commander` identifies the target action, parsing any options (`--json`, `--html`). It then uses a dynamic `import()` to lazy-load the appropriate command execution module, ensuring lightning-fast boot times.

   **↓**

4. **Service layer**  
   The execution module calls `src/services/systemService.js` (or similar) to pull low-level OS data directly from Node's `os` and `process` modules.

   **↓**

5. **Analysis engine**  
   The raw telemetry is handed off to an analyzer (e.g., `doctorService.js` or `knowledgeEngine.js`). Here, hardcoded thresholds generate grades, scores, and natural language recommendations.

   **↓**

6. **Formatter**  
   Data is processed through `src/utils/formatter.js` to convert raw byte sizes into human-readable strings (MB, GB), format dates, and safely mask sensitive values.

   **↓**

7. **Renderer**  
   The presentation module (e.g., `DashboardRenderer`, `reportBuilder.js`) wraps the formatted data into dynamic UI components using `chalk` or Unicode box drawing characters.

   **↓**

8. **Output**  
   The final payload is either written to the terminal buffer (`process.stdout.write`) or saved directly to the disk (`fs.writeFileSync`).

---

## 🎯 Strategy & Philosophy

SysProbe Pro is engineered with the following core principles:

- **Modularity**: Every feature is isolated in its own domain directory. If the interactive dashboard breaks, the static scanner remains entirely unaffected.
- **Separation of Concerns**: The CLI file `cli.js` knows _nothing_ about how to calculate a CPU load. It only knows how to route the request to the `MonitorService`.
- **Error Handling**: Wrapped in a global `try/catch` and process event listeners (`uncaughtException`). Errors are swallowed gracefully, logged silently to `logs/app.log`, and present the user with a clean, friendly terminal message rather than a terrifying stack trace.
- **Extensibility**: Because data fetching (`SystemService`) is separated from the AI Engine (`KnowledgeEngine`), adding a new cloud integration or a new diagnostic rule requires modifying only a single file.
- **Scalability**: Capable of handling massive repositories without crashing by using asynchronous polling and aggressive try-catch fallbacks during file traversal.

---

## ⚙️ Installation

Ensure you have Node.js v18+ installed on your system.

```bash
git clone https://github.com/your-username/sysprobe-pro.git
cd sysprobe-pro
npm install
```

---

## 💻 Usage

SysProbe Pro features 10 distinct operational modes.

> **Note**: You can access detailed help for any command by appending `--help`.

### `system`

Collect and display comprehensive hardware and OS information.

```bash
npm start -- system
npm start -- system --json
```

### `doctor`

Analyze your hardware constraints and Node.js environment to generate a system health grade.

```bash
npm start -- doctor
```

### `monitor`

Launch the legacy live-polling widget with dynamic historical sparklines.

```bash
npm start -- monitor
```

### `dashboard`

Launch the premium, flicker-free, interactive `btop`-style dashboard.

```bash
npm start -- dashboard
```

### `scan`

Traverse your local workspace to detect frameworks, code quality, and potential security leaks.

```bash
npm start -- scan
```

### `report`

Generate gorgeous offline summaries of your entire hardware and project ecosystem.

```bash
npm start -- report --html
npm start -- report --md
npm start -- report --json
```

### `env`

Safely inspect local variables without exposing your raw private keys.

```bash
npm start -- env
```

### `crud`

Perform simple local file system operations inside a safe sandbox.

```bash
npm start -- crud
```

### `health`

Run a rapid synthetic health check against the application daemon.

```bash
npm start -- health
```

### `ai`

Leverage the offline heuristic engine to read natural language advice regarding your computer.

```bash
npm start -- ai
```

---

## 🖥️ Output Examples

**Doctor Command Output:**

```text
================================================
               SYSTEM DOCTOR
================================================

┌ CPU Status
│ 12 Cores @ 3800MHz
│ Excellent: Suitable for heavy development.
└

┌ Memory Status
│ 78.5% Used
│ Warning: Monitor RAM usage closely.
└

┌ Node Environment
│ v26.3.0
│ Excellent: Modern Node.js version detected.
└

┌ Overall Diagnostics
│ Score: 95 / 100
│ Grade: Excellent
└
```

**AI Advisor Output:**

```text
┌ Health Score
│ Status: Good
│ Your system is healthy, though minor optimizations are possible.
└

┌ Memory Analysis
│ ❌
│ Your memory usage is high, but acceptable.
│ Operating systems cache memory dynamically to improve speed.
└
```

---

## 🛡️ Error Handling

SysProbe Pro is designed to **never crash ungracefully**.

- **Missing Values**: Because hardware APIs differ drastically between Windows, macOS, and Linux, the `SystemService` wraps all hardware calls in isolated `try/catch` blocks. If an OS does not support `fs.statfsSync` for disk capacity, the system falls back to `"N/A"` or `0` without breaking the rendering pipeline.
- **Graceful Failures**: If an unrecognized command is typed, the `cli.js` router immediately intercepts the error, paints a helpful message in red, and auto-loads the beautiful custom help menu instead of throwing a raw Node error.
- **Log Aggregation**: All underlying stack traces are piped out of the terminal and directly into a hidden `logs/app.log` file for developer debugging.

---

## 🛠️ Technologies

SysProbe Pro leverages an elite stack of lightweight, highly-optimized npm packages:

- **[Node.js](https://nodejs.org)**: The foundational runtime environment.
- **[Commander](https://www.npmjs.com/package/commander)**: The robust command-line interface framework.
- **[Chalk](https://www.npmjs.com/package/chalk)**: Terminal string styling and color coordination.
- **[Ora](https://www.npmjs.com/package/ora)**: Elegant terminal spinners and loaders.
- **[Boxen](https://www.npmjs.com/package/boxen)**: Creates the beautifully aligned terminal boxes.
- **[cli-table3](https://www.npmjs.com/package/cli-table3)**: Generates precise Unicode tables for metrics.
- **[fs-extra](https://www.npmjs.com/package/fs-extra)**: Supercharged file system management.
- **Readline (Native)**: Hand-crafted ANSI escape code engine for flicker-free dashboards.

---

## 🚀 Future Improvements

While SysProbe Pro is feature-rich, the architecture is designed to support infinite expansion. Here are 10 realistic future integrations:

1. **Docker Container Inspection**: Automatically detect and report health metrics for locally running Docker containers.
2. **Deep Packet Inspection**: Add sophisticated network analysis to track inbound/outbound bandwidth per application.
3. **Cloud Webhooks**: Option to push JSON reports directly to an AWS S3 bucket, Slack, or Discord webhook.
4. **Git Integration**: Summarize current branch status, uncommitted changes, and stale branches during the `scan` command.
5. **Interactive Setup Wizard**: An `init` command that walks users through generating a custom `sysprobe.config.json` via prompt.
6. **Daemon Mode**: Run the monitor in the background (`sysprobe-pro daemon start`) and send desktop notifications when RAM exceeds 95%.
7. **Database Probing**: Test local connections for PostgreSQL, MongoDB, or Redis instances.
8. **Automated Remediation**: Add interactive prompts to let the CLI automatically fix issues (e.g., "Press Y to format codebase with Prettier").
9. **Log Analysis**: Tail and highlight syntax errors in common local `.log` files.
10. **Custom Theming Engine**: Allow users to define their own HEX color palettes in the config file.

---

## 📄 License

This project is licensed under the **[MIT License](LICENSE)**.

<div align="center">
  <i>Built with ❤️ for modern developers.</i>
</div>

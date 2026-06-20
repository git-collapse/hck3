/**
 * @file renderer.js
 * @description Outputs scanner results to terminal and exports them to files.
 */

import { Theme } from '../utils/logger.js';
import { formatBytes } from '../utils/formatter.js';
import fs from 'fs';
import path from 'path';

export class ScannerRenderer {
  static render(data, options) {
    if (options.json) this.exportJson(data);
    if (options.md) this.exportMd(data);
    if (options.html) this.exportHtml(data);
    
    // Always show terminal UI
    this.printDashboard(data);
  }

  static printDashboard(data) {
    console.log('\n' + Theme.primary.bold('================================================'));
    console.log(Theme.primary.bold('              PROJECT ANALYSIS DASHBOARD        '));
    console.log(Theme.primary.bold('================================================\n'));

    // Project Type
    console.log(Theme.secondary.bold('┌ Project Type'));
    data.detections.forEach(d => {
      console.log(`│ ${Theme.success('✔')} ${d.name} (Confidence: ${d.confidence})`);
    });
    console.log('└\n');

    // Directory
    console.log(Theme.secondary.bold('┌ Directory Analysis'));
    console.log(`│ Total Files  : ${data.stats.totalFiles}`);
    console.log(`│ Total Folders: ${data.stats.totalFolders}`);
    console.log(`│ Total Size   : ${formatBytes(data.stats.totalSize)}`);
    console.log(`│ Deepest Dir  : ${data.stats.deepestDir} levels`);
    console.log(`│ Hidden Files : ${data.stats.hiddenFiles}`);
    console.log('└\n');

    // Source Code
    console.log(Theme.secondary.bold('┌ Source Code Analysis'));
    console.log(`│ Lang   Files  LOC     Blank  Comments`);
    Object.entries(data.stats.types).forEach(([ext, s]) => {
      if (s.files > 0) {
        console.log(`│ ${ext.padEnd(6)} ${s.files.toString().padEnd(6)} ${s.loc.toString().padEnd(7)} ${s.blank.toString().padEnd(6)} ${s.comments}`);
      }
    });
    console.log('└\n');

    // Health Score
    console.log(Theme.secondary.bold('┌ Project Quality & Health'));
    const gColor = data.quality.score >= 85 ? Theme.success : (data.quality.score >= 65 ? Theme.warning : Theme.error);
    console.log(`│ Grade: ${gColor.bold(data.quality.grade)} (${data.quality.score}/100)`);
    console.log('└\n');

    // Security
    console.log(Theme.secondary.bold('┌ Security Issues'));
    if (data.security.length === 0) {
      console.log(`│ ${Theme.success('✔ No security issues detected.')}`);
    } else {
      data.security.forEach(s => {
        const color = s.severity === 'CRITICAL' ? Theme.error.bold : (s.severity === 'HIGH' ? Theme.error : Theme.warning);
        console.log(`│ ${color(`[${s.severity}]`)} ${s.file.split(/[/\\]/).pop()} - ${s.message}`);
      });
    }
    console.log('└\n');

    // Recommendations
    const recs = [...data.dependency.findings.map(f => f.message), ...data.quality.recommendations];
    console.log(Theme.secondary.bold('┌ Recommendations'));
    if (recs.length === 0) {
      console.log(`│ ${Theme.success('✔ Repository looks optimal.')}`);
    } else {
      recs.forEach(r => console.log(`│ • ${r}`));
    }
    console.log('└\n');
  }

  static getFilePath(ext) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(reportsDir, `sysprobe-scan-${timeStr}.${ext}`);
  }

  static exportJson(data) {
    const file = this.getFilePath('json');
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(Theme.success(`✔ JSON Report exported: `) + Theme.dim(file));
  }

  static exportMd(data) {
    const file = this.getFilePath('md');
    const md = `# Project Analysis Report
*Generated at ${new Date(data.timestamp).toLocaleString()}*

## Grade: ${data.quality.grade} (${data.quality.score}/100)

## Project Type
${data.detections.map(d => `- **${d.name}** (Confidence: ${d.confidence})`).join('\n')}

## Security Findings
${data.security.length === 0 ? '*No issues detected.*' : data.security.map(s => `- **[${s.severity}]** ${s.file}: ${s.message}`).join('\n')}

## Recommendations
${[...data.dependency.findings.map(f=>f.message), ...data.quality.recommendations].map(r => `- ${r}`).join('\n')}
`;
    fs.writeFileSync(file, md);
    console.log(Theme.success(`✔ Markdown Report exported: `) + Theme.dim(file));
  }

  static exportHtml(data) {
    const file = this.getFilePath('html');
    const html = `<!DOCTYPE html><html><head><title>SysProbe Scan</title><style>
      body{font-family:sans-serif;padding:2rem;background:#f8fafc;color:#0f172a;}
      .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 2rem; }
      .grade { font-size: 3rem; font-weight: bold; color: ${data.quality.score >= 85 ? '#22c55e' : '#ef4444'}; }
    </style></head><body>
      <div class="card">
        <h1>Project Analysis Report</h1>
        <div class="grade">${data.quality.grade} (${data.quality.score}/100)</div>
      </div>
      <div class="card">
        <h3>Security Findings</h3>
        <ul>${data.security.map(s => `<li><b>[${s.severity}]</b> ${s.file}: ${s.message}</li>`).join('')}</ul>
      </div>
      <div class="card">
        <h3>Recommendations</h3>
        <ul>${[...data.dependency.findings.map(f=>f.message), ...data.quality.recommendations].map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    </body></html>`;
    fs.writeFileSync(file, html);
    console.log(Theme.success(`✔ HTML Report exported: `) + Theme.dim(file));
  }
}

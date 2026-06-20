/**
 * @file dashboardRenderer.js
 * @description Flicker-free terminal renderer using readline.
 */

import { Theme } from '../utils/logger.js';
import readline from 'readline';

export class DashboardRenderer {
  static draw(state) {
    readline.cursorTo(process.stdout, 0, 0);
    
    const w = process.stdout.columns || 80;
    const h = process.stdout.rows || 24;
    
    const isDark = state.theme === 'dark';
    const primary = isDark ? Theme.primary : Theme.secondary;
    const secondary = isDark ? Theme.secondary : Theme.primary;
    
    let out = '';
    const hr = '─'.repeat(Math.max(0, w - 2));

    const padStr = (str, len) => {
      const realLen = str.replace(/\x1B\[\d+m/g, '').length;
      if (realLen < len) {
        return str + ' '.repeat(len - realLen);
      }
      return str;
    };

    // TOP
    out += primary.bold(`┌${hr}┐\n`);
    const titleRaw = ` SYSPROBE PRO DASHBOARD | ${new Date().toLocaleTimeString()} | ${state.sysInfo.os || 'N/A'} | ${state.sysInfo.hostname || 'N/A'} `;
    const padding = Math.max(0, w - 2 - titleRaw.length);
    out += primary.bold(`│`) + Theme.success.bold(titleRaw) + ' '.repeat(padding) + primary.bold(`│\n`);
    out += primary.bold(`├${hr}┤\n`);

    const colWidth = Math.max(15, Math.floor((w - 5) / 4));
    
    const drawBar = (pct, width) => {
      const filled = Math.min(width, Math.max(0, Math.round((pct / 100) * width)));
      const empty = Math.max(0, width - filled);
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      if (pct < 60) return Theme.success(bar);
      if (pct < 85) return Theme.warning(bar);
      return Theme.error(bar);
    };

    const cpuPct = state.sysInfo.cpu.usagePercent || 0;
    const memPct = state.sysInfo.memory.usagePercent || 0;
    const diskPct = state.sysInfo.disk.usagePercent || 0;
    const mac = state.sysInfo.network ? state.sysInfo.network.mac : 'N/A';
    const ip = state.sysInfo.network ? state.sysInfo.network.ip : 'N/A';

    out += primary.bold('│ ') + secondary.bold(padStr('CPU Usage', colWidth)) + primary.bold(' │ ') +
           secondary.bold(padStr('Memory Usage', colWidth)) + primary.bold(' │ ') +
           secondary.bold(padStr('Disk Usage', colWidth)) + primary.bold(' │ ') +
           secondary.bold(padStr('Network', colWidth)) + primary.bold(' │') + ' '.repeat(Math.max(0, w - 4 * colWidth - 11)) + primary.bold('│\n');

    out += primary.bold('│ ') + padStr(`${cpuPct}% [${state.sysInfo.cpu.count || 0} Cores]`, colWidth) + primary.bold(' │ ') +
           padStr(`${memPct}%`, colWidth) + primary.bold(' │ ') +
           padStr(`${diskPct.toFixed(1)}%`, colWidth) + primary.bold(' │ ') +
           padStr(`${ip}`, colWidth) + primary.bold(' │') + ' '.repeat(Math.max(0, w - 4 * colWidth - 11)) + primary.bold('│\n');

    const barW = colWidth - 2;
    out += primary.bold('│ ') + drawBar(cpuPct, barW) + '  ' + primary.bold('│ ') +
           drawBar(memPct, barW) + '  ' + primary.bold('│ ') +
           drawBar(diskPct, barW) + '  ' + primary.bold('│ ') +
           padStr(`MAC: ${mac}`, colWidth) + primary.bold(' │') + ' '.repeat(Math.max(0, w - 4 * colWidth - 11)) + primary.bold('│\n');

    out += primary.bold(`├${hr}┤\n`);

    let linesUsed = 7;

    // Overlay check
    if (state.activeOverlay) {
      const overlayOut = this.renderOverlay(state, w);
      const oLines = overlayOut.split('\n');
      oLines.forEach(l => {
        if (l.trim().length > 0) {
          out += l + '\n';
          linesUsed++;
        }
      });
    } else {
      out += primary.bold('│ ') + Theme.error.bold('RECENT ALERTS'.padEnd(w - 4)) + primary.bold(' │\n');
      linesUsed++;
      if (state.alerts.length === 0) {
        out += primary.bold('│ ') + Theme.success('✔ System is operating normally.'.padEnd(w - 4)) + primary.bold(' │\n');
        linesUsed++;
      } else {
        state.alerts.forEach(a => {
           out += primary.bold('│ ') + Theme.error(a.padEnd(w - 4)) + primary.bold(' │\n');
           linesUsed++;
        });
      }

      out += primary.bold('│ ' + ' '.repeat(Math.max(0, w - 4)) + ' │\n'); linesUsed++;
      const hl = `SYSTEM HEALTH: ${state.doctorData.grade} (${state.doctorData.score}/100)`;
      out += primary.bold('│ ') + Theme.success.bold(hl.padEnd(w - 4)) + primary.bold(' │\n'); linesUsed++;
    }

    // Fill to bottom
    let fill = h - linesUsed - 1; // -1 for footer
    while(fill > 0) {
      out += primary.bold('│' + ' '.repeat(Math.max(0, w - 2)) + '│\n');
      fill--;
    }

    // Footer
    const footerText = ' [Q] Quit  [R] Refresh  [T] Theme  [A] AI Advisor  [D] Doctor  [S] Scan  [P] Process View  [H] Help ';
    const fPad = Math.max(0, w - 2 - footerText.length);
    out += primary.bold(`└`) + Theme.secondary(footerText) + primary.bold('─'.repeat(fPad)) + primary.bold(`┘`);

    process.stdout.write(out);
  }

  static renderOverlay(state, w) {
    let out = '';
    const innerW = w - 6;
    if (innerW < 10) return '';
    const hr = '─'.repeat(innerW);
    out += `  ┌${hr}┐  `.padEnd(w) + `\n`;
    
    const contentPad = (str) => `  │ ` + str.padEnd(innerW) + ` │  \n`;
    
    if (state.activeOverlay === 'AI') {
      out += `  │ ` + Theme.secondary.bold('AI SYSTEM ADVISOR'.padEnd(innerW)) + ` │  \n`;
      out += `  ├${hr}┤  \n`;
      out += contentPad(`Score: ${state.aiAdvice.score}`);
      out += contentPad(`Reason: ${state.aiAdvice.scoreReason}`);
    } else if (state.activeOverlay === 'DOCTOR') {
      out += `  │ ` + Theme.secondary.bold('SYSTEM DOCTOR'.padEnd(innerW)) + ` │  \n`;
      out += `  ├${hr}┤  \n`;
      out += contentPad(`Grade: ${state.doctorData.grade}`);
      out += contentPad(`Recommendations: ${state.doctorData.recommendations ? state.doctorData.recommendations.length : 0}`);
    } else if (state.activeOverlay === 'SCAN') {
      out += `  │ ` + Theme.secondary.bold('PROJECT SCAN SUMMARY'.padEnd(innerW)) + ` │  \n`;
      out += `  ├${hr}┤  \n`;
      out += contentPad(`Detailed scan data available via 'scan' command.`);
    } else if (state.activeOverlay === 'PROCESS') {
      out += `  │ ` + Theme.secondary.bold('TOP PROCESSES'.padEnd(innerW)) + ` │  \n`;
      out += `  ├${hr}┤  \n`;
      out += contentPad(`(Live process view is active in background)`);
    } else if (state.activeOverlay === 'HELP') {
      out += `  │ ` + Theme.secondary.bold('HELP / SHORTCUTS'.padEnd(innerW)) + ` │  \n`;
      out += `  ├${hr}┤  \n`;
      out += contentPad(`Q - Quit the dashboard`);
      out += contentPad(`R - Force immediate refresh`);
      out += contentPad(`T - Toggle Light/Dark theme`);
      out += contentPad(`A, D, S, P - Toggle respective overlays`);
      out += contentPad(`Esc or any hotkey - Close overlay`);
    }

    out += `  └${hr}┘  \n`;
    return out;
  }
}

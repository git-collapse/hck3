/**
 * @file DashboardRenderer.js
 * @description Orchestrates the layout, widgets, scrolling, and alerts.
 */

import { ThemeManager } from './ThemeManager.js';
import { SparklineRenderer } from './SparklineRenderer.js';
import { WidgetRenderer } from './WidgetRenderer.js';

export class DashboardRenderer {
  constructor(historyStore, widgetManager) {
    this.historyStore = historyStore;
    this.widgetManager = widgetManager;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.needsFullRedraw = true;
    this.showHelp = false;
    this.isPaused = false;
  }

  checkResize() {
    const { columns, rows } = process.stdout;
    if (this.lastWidth !== columns || this.lastHeight !== rows) {
      this.lastWidth = columns || 80;
      this.lastHeight = rows || 24;
      this.forceRedraw();
    }
  }

  forceRedraw() {
    this.needsFullRedraw = true;
    WidgetRenderer.clearScreen();
  }

  render(metrics) {
    this.checkResize();
    const w = this.lastWidth;
    const scroll = this.widgetManager.scrollOffset;
    
    if (this.needsFullRedraw) WidgetRenderer.clearScreen();

    // Alerts logic
    const alerts = [];
    if (metrics.cpu.usagePercent > 90) alerts.push('CPU Critical');
    if (metrics.memory.usagePercent > 90) alerts.push('RAM Critical');
    if (metrics.disk.usagePercent > 90) alerts.push('Disk Critical');
    if (metrics.network.internet === 'No') alerts.push('Network Disconnected');

    let y = -scroll;

    // --- Header ---
    if (this.needsFullRedraw || scroll > 0) WidgetRenderer.drawBox(0, y, w, 3);
    const title = ' SYSPROBE PRO ';
    WidgetRenderer.writeAt(Math.floor((w - title.length) / 2), y + 1, ThemeManager.colors.title(title));
    y += 3;

    // --- Alerts ---
    if (alerts.length > 0) {
      WidgetRenderer.writeAt(2, y, ThemeManager.colors.error.bold(` ⚠️ ALERTS: ${alerts.join(' │ ')} `).padEnd(w - 4));
      y += 2;
    }

    // --- Top Bar ---
    WidgetRenderer.drawBox(0, y, w, 3);
    const battStr = metrics.battery.available ? `${metrics.battery.percent}%` : 'N/A';
    const topText = ` ${ThemeManager.icons.cpu} CPU: ${metrics.cpu.usagePercent}% │ ${ThemeManager.icons.ram} RAM: ${metrics.memory.usagePercent}% │ ${ThemeManager.icons.disk} Disk: ${metrics.disk.usagePercent}% │ ${ThemeManager.icons.battery} Batt: ${battStr} │ ${ThemeManager.icons.network} Net: ${metrics.network.health} `;
    WidgetRenderer.writeAt(2, y + 1, topText.substring(0, w - 4).padEnd(w - 4));
    y += 3;

    // --- Live Graphs ---
    const showCpu = this.widgetManager.widgets.cpu;
    const showMem = this.widgetManager.widgets.mem;
    const showDisk = this.widgetManager.widgets.disk;
    const showNet = this.widgetManager.widgets.net;
    
    const visibleGraphs = [showCpu, showMem, showDisk, showNet].filter(Boolean).length;

    if (visibleGraphs > 0) {
      const graphH = visibleGraphs + 3;
      WidgetRenderer.drawBox(0, y, w, graphH);
      WidgetRenderer.drawTitle(2, y, w, 'Live Graphs');

      const graphW = Math.max(5, w - 14);
      let gY = y + 1;

      if (showCpu) {
        const cpuLine = SparklineRenderer.render(this.historyStore.get('cpu'), graphW, 0, 100);
        WidgetRenderer.writeAt(2, gY++, ThemeManager.colors.primary('CPU   ') + ThemeManager.getCpuColor(metrics.cpu.usagePercent)(cpuLine));
      }
      if (showMem) {
        const ramLine = SparklineRenderer.render(this.historyStore.get('ram'), graphW, 0, 100);
        WidgetRenderer.writeAt(2, gY++, ThemeManager.colors.primary('RAM   ') + ThemeManager.getRamColor(metrics.memory.usagePercent)(ramLine));
      }
      if (showDisk) {
        const diskLine = SparklineRenderer.render(this.historyStore.get('disk'), graphW, 0, 100);
        WidgetRenderer.writeAt(2, gY++, ThemeManager.colors.primary('Disk  ') + ThemeManager.getDiskColor()(diskLine));
      }
      if (showNet) {
        const netRxHist = this.historyStore.get('networkRx');
        const netLine = SparklineRenderer.render(netRxHist, graphW, 0, Math.max(1024, ...netRxHist));
        WidgetRenderer.writeAt(2, gY++, ThemeManager.colors.primary('Net ↓ ') + ThemeManager.getNetworkColor()(netLine));
      }
      y += graphH;
    }

    // --- Top Processes ---
    if (this.widgetManager.widgets.processes) {
      WidgetRenderer.drawBox(0, y, w, 7);
      WidgetRenderer.drawTitle(2, y, w, 'Top Processes');
      WidgetRenderer.writeAt(2, y + 1, ThemeManager.colors.secondary('PID'.padEnd(10) + 'Process Name'.padEnd(25) + 'CPU %'.padEnd(10) + 'Memory'));
      let pY = y + 2;
      for (let i = 0; i < 4; i++) {
        const p = metrics.processes[i];
        if (p) {
          const row = `${p.pid.padEnd(10)}${p.name.padEnd(25)}${p.cpu.padEnd(10)}${p.mem}`;
          WidgetRenderer.writeAt(2, pY++, row.substring(0, w - 4).padEnd(w - 4));
        } else {
          WidgetRenderer.writeAt(2, pY++, ' '.repeat(Math.max(0, w - 4)));
        }
      }
      y += 7;
    }

    // --- Health Summary ---
    if (this.widgetManager.widgets.health) {
      WidgetRenderer.drawBox(0, y, w, 4);
      WidgetRenderer.drawTitle(2, y, w, 'Health Summary');
      const sum1 = `Sys: ${metrics.grade} │ CPU: ${metrics.cpu.health} │ Mem: ${metrics.memory.health} │ Dsk: ${metrics.disk.health} │ Net: ${metrics.network.health}`;
      WidgetRenderer.writeAt(2, y + 1, sum1.substring(0, w - 4).padEnd(w - 4));
      
      const gradeColor = metrics.grade === 'A+' || metrics.grade === 'A' ? ThemeManager.colors.success : (metrics.grade === 'B' || metrics.grade === 'C' ? ThemeManager.colors.warning : ThemeManager.colors.error);
      const gradeText = `Overall Grade: ${gradeColor.bold(metrics.grade)}`;
      WidgetRenderer.writeAt(2, y + 2, WidgetRenderer.padAnsi(gradeText, Math.max(0, w - 4)));
      y += 4;
    }

    // Max Scroll Logic
    const drawnHeight = y + scroll; 
    const terminalHeight = this.lastHeight - 3;
    if (drawnHeight > terminalHeight) {
      this.widgetManager.maxScroll = drawnHeight - terminalHeight;
    } else {
      this.widgetManager.maxScroll = 0;
      this.widgetManager.scrollOffset = 0;
    }

    // --- Footer ---
    const footerY = this.lastHeight - 3;
    WidgetRenderer.drawBox(0, footerY, w, 3);
    const pauseStr = this.isPaused ? ThemeManager.colors.warning('[PAUSED]') : '';
    const footer = `[q] Quit │ ${pauseStr} [h] Help │ [t] Theme: ${ThemeManager.themeName} │ [1-6] Toggle │ Ref: 1s`;
    WidgetRenderer.writeAt(2, footerY + 1, ThemeManager.colors.dim(footer).substring(0, w - 4).padEnd(w - 4));

    // --- Help Overlay ---
    if (this.showHelp) {
      const hw = 40;
      const hh = 12;
      const hx = Math.floor((w - hw) / 2);
      const hy = Math.floor((this.lastHeight - hh) / 2);
      
      WidgetRenderer.drawBox(hx, hy, hw, hh);
      WidgetRenderer.drawTitle(hx + 2, hy, hw, 'HELP / SHORTCUTS');
      
      const helps = [
        ' q     : Quit',
        ' p     : Pause/Resume',
        ' r     : Force Refresh',
        ' t     : Cycle Themes',
        ' h     : Toggle Help',
        ' 1-6   : Toggle Widgets',
        ' ↑ / ↓ : Scroll'
      ];
      
      let cy = hy + 2;
      helps.forEach(text => {
        WidgetRenderer.writeAt(hx + 2, cy++, ThemeManager.colors.primary(text).padEnd(hw - 4));
      });
      WidgetRenderer.writeAt(hx + 2, cy + 1, ThemeManager.colors.dim(' Press "h" to close ').padEnd(hw - 4));
    }

    WidgetRenderer.writeAt(0, this.lastHeight - 1, '');
    this.needsFullRedraw = false;
  }
}

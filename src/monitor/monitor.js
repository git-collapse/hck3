/**
 * @file monitor.js
 * @description Live interactive terminal monitoring dashboard.
 */

import { MonitorService } from './monitorService.js';
import { HistoryStore } from './historyStore.js';
import { DashboardRenderer } from './renderer/DashboardRenderer.js';
import { ThemeManager } from './renderer/ThemeManager.js';
import { InputHandler } from './renderer/InputHandler.js';
import { WidgetManager } from './renderer/WidgetManager.js';
import { WidgetRenderer } from './renderer/WidgetRenderer.js';

let monitorInterval;

export default async function(options = {}) {
  const service = new MonitorService();
  const historyStore = new HistoryStore(60);
  const widgetManager = new WidgetManager();
  const renderer = new DashboardRenderer(historyStore, widgetManager);

  let isPaused = false;
  let cachedMetrics = service.getRealTimeMetrics();

  const fetchAndRender = () => {
    if (!isPaused) {
      cachedMetrics = service.getRealTimeMetrics();
      
      historyStore.add('cpu', cachedMetrics.cpu.usagePercent);
      historyStore.add('ram', cachedMetrics.memory.usagePercent);
      historyStore.add('disk', cachedMetrics.disk.usagePercent);
      historyStore.add('networkRx', cachedMetrics.network.rxSpeed);
      historyStore.add('networkTx', cachedMetrics.network.txSpeed);
    }
    
    renderer.isPaused = isPaused;
    renderer.render(cachedMetrics);
  };

  const inputHandler = new InputHandler({
    onQuit: () => handleExit(inputHandler),
    onPauseToggle: () => {
      isPaused = !isPaused;
      renderer.forceRedraw();
      fetchAndRender();
    },
    onForceRefresh: () => {
      renderer.forceRedraw();
      if (isPaused) {
        cachedMetrics = service.getRealTimeMetrics();
      }
      fetchAndRender();
    },
    onHelpToggle: () => {
      renderer.showHelp = !renderer.showHelp;
      renderer.forceRedraw();
      fetchAndRender();
    },
    onThemeToggle: () => {
      ThemeManager.cycleTheme();
      renderer.forceRedraw();
      fetchAndRender();
    },
    onWidgetToggle: (key) => {
      widgetManager.toggle(key);
      renderer.forceRedraw();
      fetchAndRender();
    },
    onScroll: (dir) => {
      widgetManager.scroll(dir);
      renderer.forceRedraw();
      fetchAndRender();
    }
  });

  process.stdout.write('\x1B[?25l');

  process.stdout.on('resize', () => {
    renderer.forceRedraw();
    fetchAndRender();
  });

  WidgetRenderer.clearScreen();
  fetchAndRender();
  monitorInterval = setInterval(fetchAndRender, 1000);
}

function handleExit(inputHandler) {
  if (monitorInterval) clearInterval(monitorInterval);
  inputHandler.destroy();
  process.stdout.write('\x1B[?25h');
  WidgetRenderer.clearScreen();
  
  console.log('\n\n' + ThemeManager.colors.dim('Stopping monitor...'));
  console.log(ThemeManager.colors.success('Monitoring session ended successfully.'));
  console.log(ThemeManager.colors.primary('Thank you for using SysProbe-Pro.\n'));
  process.exit(0);
}

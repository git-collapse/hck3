/**
 * @file dashboardCommand.js
 * @description Main orchestrator for the premium terminal dashboard.
 */

import readline from 'readline';
import { DashboardData } from './dashboardData.js';
import { DashboardRenderer } from './dashboardRenderer.js';

export default async function runDashboard() {
  process.stdout.write('\x1B[?25l'); // Hide cursor
  process.stdout.write('\x1B[2J'); // Clear screen once

  const state = new DashboardData();
  state.refresh();
  DashboardRenderer.draw(state);

  const timer = setInterval(() => {
    state.refresh();
    DashboardRenderer.draw(state);
  }, 1000);

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const handleKeypress = (str, key) => {
    const k = (key && key.name) ? key.name.toLowerCase() : (str ? str.toLowerCase().trim() : '');
    
    if (k === 'q' || (key && key.ctrl && k === 'c')) {
      clearInterval(timer);
      process.stdout.write('\x1B[?25h'); // Show cursor
      process.stdout.write('\x1B[2J\x1B[H'); // Clear
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.exit(0);
    }

    if (k === 'r') {
      state.refresh();
      DashboardRenderer.draw(state);
    } else if (k === 't') {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      DashboardRenderer.draw(state);
    } else if (k === 'a') {
      state.activeOverlay = state.activeOverlay === 'AI' ? null : 'AI';
      DashboardRenderer.draw(state);
    } else if (k === 'd') {
      state.activeOverlay = state.activeOverlay === 'DOCTOR' ? null : 'DOCTOR';
      DashboardRenderer.draw(state);
    } else if (k === 's') {
      state.activeOverlay = state.activeOverlay === 'SCAN' ? null : 'SCAN';
      DashboardRenderer.draw(state);
    } else if (k === 'p') {
      state.activeOverlay = state.activeOverlay === 'PROCESS' ? null : 'PROCESS';
      DashboardRenderer.draw(state);
    } else if (k === 'h') {
      state.activeOverlay = state.activeOverlay === 'HELP' ? null : 'HELP';
      DashboardRenderer.draw(state);
    } else if (k === 'escape') {
      state.activeOverlay = null;
      DashboardRenderer.draw(state);
    }
  };

  process.stdin.on('keypress', handleKeypress);

  process.stdout.on('resize', () => {
    process.stdout.write('\x1B[2J');
    DashboardRenderer.draw(state);
  });
}

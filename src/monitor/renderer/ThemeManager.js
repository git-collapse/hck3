/**
 * @file ThemeManager.js
 * @description Manages dashboard colors, icons, and conditional themes.
 */

import chalk from 'chalk';

const THEMES = [
  {
    name: 'Cyber Blue',
    primary: chalk.cyanBright,
    secondary: chalk.blueBright,
    title: chalk.cyanBright.bold,
    border: chalk.blue
  },
  {
    name: 'Hacker Green',
    primary: chalk.greenBright,
    secondary: chalk.green,
    title: chalk.greenBright.bold,
    border: chalk.green.dim
  },
  {
    name: 'Dracula',
    primary: chalk.hex('#ff79c6'),
    secondary: chalk.hex('#bd93f9'),
    title: chalk.hex('#ff79c6').bold,
    border: chalk.hex('#6272a4')
  },
  {
    name: 'Nord',
    primary: chalk.hex('#88c0d0'),
    secondary: chalk.hex('#81a1c1'),
    title: chalk.hex('#88c0d0').bold,
    border: chalk.hex('#4c566a')
  }
];

class ThemeManagerClass {
  constructor() {
    this.themeIndex = 0;
    this.baseColors = {
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      dim: chalk.gray
    };
    
    this.icons = {
      cpu: '⚙️',
      ram: '🧠',
      disk: '💾',
      battery: '🔋',
      network: '🌐',
      process: '📊',
      health: '❤️'
    };

    this.box = {
      tl: '┌', tr: '┐', bl: '└', br: '┘',
      h: '─', v: '│',
      vl: '├', vr: '┤', ht: '┬', hb: '┴', c: '┼'
    };
  }

  get colors() {
    return {
      ...this.baseColors,
      ...THEMES[this.themeIndex]
    };
  }

  get themeName() {
    return THEMES[this.themeIndex].name;
  }

  cycleTheme() {
    this.themeIndex = (this.themeIndex + 1) % THEMES.length;
  }

  getCpuColor(percent) {
    if (percent <= 50) return chalk.green;
    if (percent <= 80) return chalk.yellow;
    return chalk.red;
  }

  getRamColor(percent) {
    if (percent <= 60) return chalk.green;
    if (percent <= 85) return chalk.hex('#FFA500'); // Orange
    return chalk.red;
  }

  getDiskColor() {
    return chalk.blue;
  }

  getBatteryColor(percent, isCharging) {
    if (isCharging) return chalk.green;
    if (percent <= 15) return chalk.red;
    if (percent <= 40) return chalk.yellow;
    return chalk.green;
  }

  getNetworkColor() {
    return chalk.cyan;
  }
}

export const ThemeManager = new ThemeManagerClass();

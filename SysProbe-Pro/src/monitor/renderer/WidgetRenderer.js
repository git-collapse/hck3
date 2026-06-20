/**
 * @file WidgetRenderer.js
 * @description Draws terminal boxes and handles precise cursor positioning with viewport clipping.
 */

import { ThemeManager } from './ThemeManager.js';
import readline from 'readline';

export class WidgetRenderer {
  static drawBox(x, y, w, h) {
    const box = ThemeManager.box;
    const border = ThemeManager.colors.border;
    
    this.writeAt(x, y, border(box.tl + box.h.repeat(Math.max(0, w - 2)) + box.tr));
    for (let i = 1; i < h - 1; i++) {
      this.writeAt(x, y + i, border(box.v) + ' '.repeat(Math.max(0, w - 2)) + border(box.v));
    }
    this.writeAt(x, y + h - 1, border(box.bl + box.h.repeat(Math.max(0, w - 2)) + box.br));
  }

  static drawTitle(x, y, w, title) {
    const box = ThemeManager.box;
    const border = ThemeManager.colors.border;
    
    this.writeAt(x, y, border(box.vl) + ThemeManager.colors.title(` ${title} `) + border(box.vr));
  }

  static writeAt(x, y, text) {
    const rows = process.stdout.rows;
    // Clip anything outside the terminal viewport
    if (y < 0 || y >= rows) return; 
    
    readline.cursorTo(process.stdout, x, y);
    process.stdout.write(text);
  }

  static clearScreen() {
    process.stdout.write('\x1B[2J\x1B[0f');
  }

  static stripAnsi(str) {
    return str.replace(/\x1B\[\d+m/g, '');
  }

  static padAnsi(str, len) {
    const strippedLen = this.stripAnsi(str).length;
    const padding = len - strippedLen;
    if (padding > 0) {
      return str + ' '.repeat(padding);
    }
    return str;
  }
}

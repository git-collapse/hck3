/**
 * @file InputHandler.js
 * @description Listens to raw keystrokes and dispatches interactive events.
 */

export class InputHandler {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.init();
  }

  init() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (key) => {
        // Ctrl+C or 'q'
        if (key === '\u0003' || key.toLowerCase() === 'q') {
          if (this.callbacks.onQuit) this.callbacks.onQuit();
        }
        else if (key.toLowerCase() === 'p') {
          if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle();
        }
        else if (key.toLowerCase() === 'r') {
          if (this.callbacks.onForceRefresh) this.callbacks.onForceRefresh();
        }
        else if (key.toLowerCase() === 'h') {
          if (this.callbacks.onHelpToggle) this.callbacks.onHelpToggle();
        }
        else if (key.toLowerCase() === 't') {
          if (this.callbacks.onThemeToggle) this.callbacks.onThemeToggle();
        }
        else if (key >= '1' && key <= '6') {
          if (this.callbacks.onWidgetToggle) this.callbacks.onWidgetToggle(key);
        }
        else if (key === '\u001b[A') { // Up arrow
          if (this.callbacks.onScroll) this.callbacks.onScroll(-1);
        }
        else if (key === '\u001b[B') { // Down arrow
          if (this.callbacks.onScroll) this.callbacks.onScroll(1);
        }
      });
    }
  }

  destroy() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }
}

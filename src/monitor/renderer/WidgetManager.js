/**
 * @file WidgetManager.js
 * @description Manages dashboard layout state and scrolling offset.
 */

export class WidgetManager {
  constructor() {
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // Toggles for different dashboard elements
    this.widgets = {
      cpu: true,
      mem: true,
      disk: true,
      net: true,
      processes: true,
      health: true
    };
  }

  toggle(key) {
    switch (key) {
      case '1': this.widgets.cpu = !this.widgets.cpu; break;
      case '2': this.widgets.mem = !this.widgets.mem; break;
      case '3': this.widgets.disk = !this.widgets.disk; break;
      case '4': this.widgets.net = !this.widgets.net; break;
      case '5': this.widgets.processes = !this.widgets.processes; break;
      case '6': this.widgets.health = !this.widgets.health; break;
    }
    // Snap to top to avoid losing content offscreen when resizing
    this.scrollOffset = 0;
  }

  scroll(dir) {
    this.scrollOffset += dir;
    if (this.scrollOffset < 0) this.scrollOffset = 0;
    if (this.scrollOffset > this.maxScroll) this.scrollOffset = this.maxScroll;
  }
}

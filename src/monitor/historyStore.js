/**
 * @file historyStore.js
 * @description Stores historical metrics (up to 60 samples) for rendering live sparkline charts.
 */

export class HistoryStore {
  constructor(maxSize = 60) {
    this.maxSize = maxSize;
    this.history = {
      cpu: [],
      ram: [],
      disk: [],
      networkRx: [],
      networkTx: []
    };
  }

  add(type, value) {
    if (!this.history[type]) this.history[type] = [];
    this.history[type].push(value);
    if (this.history[type].length > this.maxSize) {
      this.history[type].shift();
    }
  }

  get(type) {
    return this.history[type] || [];
  }
}

/**
 * @file SparklineRenderer.js
 * @description Converts numerical arrays into Unicode sparklines.
 */

export class SparklineRenderer {
  static render(data, width, min = 0, max = 100) {
    const ticks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    
    if (!data || data.length === 0) return ' '.repeat(width);

    // Take the most recent data points up to the specified width
    const recentData = data.slice(-width);
    const padCount = Math.max(0, width - recentData.length);
    const padding = ' '.repeat(padCount);

    const actualMax = max > 0 ? max : 1; // Prevent division by zero

    const line = recentData.map(val => {
      let p = ((val - min) / (actualMax - min)) * 100;
      if (p < 0) p = 0;
      if (p > 100) p = 100;
      if (isNaN(p)) p = 0;
      
      const tickIndex = Math.min(ticks.length - 1, Math.floor((p / 100) * ticks.length));
      return ticks[tickIndex];
    }).join('');

    return padding + line;
  }
}

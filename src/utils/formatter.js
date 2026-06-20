/**
 * @file formatter.js
 * @description Data formatting utilities
 * @responsibilities Provides consistent formatting for bytes, dates, and uptimes.
 */

export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Not Available';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatBytesInMBGB(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Not Available';
  const mb = parseFloat((bytes / (1024 * 1024)).toFixed(2));
  const gb = parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
  return `${gb} GB (${mb} MB)`;
}

export function formatUptime(seconds) {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return 'Not Available';
  
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}

export function formatDate(date) {
  if (!date || !(date instanceof Date)) return 'Not Available';
  return date.toLocaleString();
}

export function safeValue(value) {
  return value !== undefined && value !== null && value !== '' ? value : 'Not Available';
}

/**
 * Generates a visual progress bar.
 * @param {number} percent - The percentage (0-100)
 * @param {number} length - Length of the progress bar in characters
 * @returns {string} Visual progress bar
 */
export function generateProgressBar(percent, length = 20) {
  const p = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  const filledLength = Math.round((p / 100) * length);
  const emptyLength = length - filledLength;
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  return `${filled}${empty}`;
}

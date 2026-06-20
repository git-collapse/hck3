/**
 * @file errors.js
 * @description Custom Error Definitions & Global Error Handling
 * @responsibilities Defines specific error classes. Handles uncaught exceptions gracefully.
 * @future Add error translation support.
 */

import { Logger, Theme } from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, suggestion = '') {
    super(message);
    this.name = 'AppError';
    this.suggestion = suggestion;
  }
}

export function handleGlobalError(error) {
  Logger.stopSpinner(false, 'Operation encountered a critical failure.');
  
  if (error instanceof AppError) {
    Logger.error(error.message);
    if (error.suggestion) {
      console.log(Theme.dim(`💡 Suggestion: ${error.suggestion}`));
    }
  } else {
    Logger.error('An unexpected error occurred.', error);
    console.log(Theme.dim(`💡 Suggestion: Try running with DEBUG=true for more details.`));
  }
  
  process.exit(1);
}

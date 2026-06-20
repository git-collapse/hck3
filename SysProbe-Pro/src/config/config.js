/**
 * @file config.js
 * @description Configuration Management
 * @responsibilities Loads and validates application configuration.
 * @future Support remote configuration fetching.
 */

import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';

export class ConfigManager {
  static loadConfig() {
    try {
      const configPath = path.resolve(process.cwd(), 'config.json');
      if (fs.existsSync(configPath)) {
        Logger.info('Found config.json, loading configuration...');
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(fileContent);
      }
      return {}; // Default config
    } catch (error) {
      Logger.warn('Failed to parse config.json. Using default configuration.');
      return {};
    }
  }
}

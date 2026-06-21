import fs from 'fs-extra';
import path from 'path';

export class CrudService {
  static createEnvelope(success, data = null, error = null) {
    return { success, data, error };
  }

  static async create(filePath, content, forceOpt = false) {
    try {
      const isForce = typeof forceOpt === 'object' ? forceOpt.force : forceOpt;
      const exists = await fs.pathExists(filePath);
      if (exists && !isForce) {
        return this.createEnvelope(false, null, 'File already exists. Use force to overwrite.');
      }
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      
      const stats = await fs.stat(filePath);
      
      return this.createEnvelope(true, { 
        operation: 'CREATE', 
        sizeBytes: stats.size,
        path: filePath 
      });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async read(filePath) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return this.createEnvelope(false, null, 'File not found.');
      }
      
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return this.createEnvelope(false, null, 'Path is a directory, not a file.');
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      return this.createEnvelope(true, { 
        content, 
        sizeBytes: stats.size,
        lines,
        extension: path.extname(filePath),
        created: stats.birthtime,
        modified: stats.mtime
      });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async update(filePath, payload) {
    try {
      const readRes = await this.read(filePath);
      if (!readRes.success) return readRes;

      // Create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.${timestamp}.bak`;
      await fs.copy(filePath, backupPath);

      let newContent;
      if (typeof payload === 'function') {
        newContent = payload(readRes.data.content);
      } else {
        newContent = payload;
      }

      await fs.writeFile(filePath, newContent, 'utf-8');
      
      const previousLines = readRes.data.content.split('\n').length;
      const newLines = newContent.split('\n').length;
      
      return this.createEnvelope(true, { 
        backupPath, 
        previousLines, 
        newLines 
      });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async delete(filePath, skipBackup = false) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return this.createEnvelope(false, null, 'File not found.');
      }

      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
         return this.createEnvelope(false, null, 'Path is a directory, use recursive delete.');
      }

      let backupPath = null;
      // Note test handles skipBackup differently, wait test signature: deleteFile(path, {skipBackup:true})
      const options = typeof skipBackup === 'object' ? skipBackup : { skipBackup };
      
      if (!options.skipBackup) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = `${filePath}.${timestamp}.bak`;
        await fs.copy(filePath, backupPath);
      }

      await fs.remove(filePath);
      return this.createEnvelope(true, { backedUpTo: backupPath });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async list(dirPath, options = {}) {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) {
         return this.createEnvelope(false, null, 'Directory does not exist.');
      }

      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
         return this.createEnvelope(false, null, 'Path is not a directory.');
      }

      const files = [];
      const recursive = options.recursive || false;
      const extFilter = options.extension || null;

      async function traverse(currentPath) {
        const items = await fs.readdir(currentPath);
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            if (recursive) {
              await traverse(itemPath);
            }
          } else {
            if (!extFilter || itemPath.endsWith(extFilter)) {
              files.push({ name: item, path: itemPath });
            }
          }
        }
      }

      await traverse(dirPath);

      return this.createEnvelope(true, { files, totalFiles: files.length });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }
}

import fs from 'fs-extra';
import path from 'path';

export class CrudService {
  static createEnvelope(success, data = null, error = null) {
    return { success, data, error };
  }

  static async create(filePath, content, force = false) {
    try {
      const exists = await fs.pathExists(filePath);
      if (exists && !force) {
        return this.createEnvelope(false, null, 'File already exists. Use force to overwrite.');
      }
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      return this.createEnvelope(true, { path: filePath });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async read(filePath) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return this.createEnvelope(false, null, 'File does not exist.');
      }
      
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return this.createEnvelope(false, null, 'Path is a directory, not a file.');
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      const metadata = {
        sizeBytes: stats.size,
        lines,
        extension: path.extname(filePath),
        created: stats.birthtime,
        modified: stats.mtime
      };

      return this.createEnvelope(true, { content, metadata });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async update(filePath, payload) {
    try {
      const readRes = await this.read(filePath);
      if (!readRes.success) return readRes; // return fail

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
      return this.createEnvelope(true, { backupPath });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async delete(filePath, skipBackup = false) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return this.createEnvelope(false, null, 'File does not exist.');
      }

      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
         return this.createEnvelope(false, null, 'Path is a directory, use recursive delete.');
      }

      let backupPath = null;
      if (!skipBackup) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = `${filePath}.${timestamp}.bak`;
        await fs.copy(filePath, backupPath);
      }

      await fs.remove(filePath);
      return this.createEnvelope(true, { backupPath });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }

  static async list(dirPath, recursive = false, extFilter = null) {
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
              files.push(itemPath);
            }
          }
        }
      }

      await traverse(dirPath);

      return this.createEnvelope(true, { files });
    } catch (err) {
      return this.createEnvelope(false, null, err.message);
    }
  }
}

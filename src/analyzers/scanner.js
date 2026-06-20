/**
 * @file scanner.js
 * @description Central orchestrator for the project scanner engine.
 */

import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { SecurityAnalyzer } from './securityAnalyzer.js';
import { DependencyAnalyzer } from './dependencyAnalyzer.js';
import { QualityAnalyzer } from './qualityAnalyzer.js';
import { ScannerRenderer } from './renderer.js';

export default async function runScanner(options = {}) {
  Logger.startSpinner('Analyzing project structure and metadata...');
  
  const cwd = process.cwd();
  
  const depResults = DependencyAnalyzer.analyze(cwd);
  const qualResults = QualityAnalyzer.analyze(cwd);
  const secAnalyzer = new SecurityAnalyzer();

  const stats = {
    totalFolders: 0,
    totalFiles: 0,
    totalSize: 0,
    hiddenFiles: 0,
    largestFiles: [],
    largestFolders: [],
    deepestDir: 0,
    types: {
      js: { files: 0, loc: 0, blank: 0, comments: 0 },
      ts: { files: 0, loc: 0, blank: 0, comments: 0 },
      json: { files: 0, loc: 0, blank: 0, comments: 0 },
      md: { files: 0, loc: 0, blank: 0, comments: 0 },
      html: { files: 0, loc: 0, blank: 0, comments: 0 },
      css: { files: 0, loc: 0, blank: 0, comments: 0 }
    },
    flags: { hasPy: false, hasJava: false, hasC: false, hasGo: false }
  };

  const traverse = (dir, depth = 0) => {
    if (depth > stats.deepestDir) stats.deepestDir = depth;
    
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) { return 0; }

    let dirSize = 0;

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const isHidden = entry.name.startsWith('.');

      if (entry.isDirectory()) {
        stats.totalFolders++;
        // Ignore deep analysis for heavy folders to preserve performance
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        
        const childSize = traverse(fullPath, depth + 1);
        dirSize += childSize;
        
        stats.largestFolders.push({ name: entry.name, size: childSize });
      } else {
        stats.totalFiles++;
        if (isHidden) stats.hiddenFiles++;

        let size = 0;
        try {
          const s = fs.statSync(fullPath);
          size = s.size;
          dirSize += size;
          stats.totalSize += size;
          stats.largestFiles.push({ name: entry.name, size });
        } catch(e) {}

        const ext = path.extname(entry.name).toLowerCase();
        
        // Security & Source analysis
        if (size < 2000000 && !isHidden && !entry.name.endsWith('.lock')) { 
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            secAnalyzer.analyzeFile(fullPath, content);
            
            const lines = content.split('\n');
            const totalLines = lines.length;
            const blankLines = lines.filter(l => l.trim() === '').length;
            const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#') || l.trim().startsWith('/*')).length;

            if (ext === '.js' || ext === '.jsx') {
              stats.types.js.files++; stats.types.js.loc += totalLines; stats.types.js.blank += blankLines; stats.types.js.comments += commentLines;
            } else if (ext === '.ts' || ext === '.tsx') {
              stats.types.ts.files++; stats.types.ts.loc += totalLines; stats.types.ts.blank += blankLines; stats.types.ts.comments += commentLines;
            } else if (ext === '.json') {
              stats.types.json.files++; stats.types.json.loc += totalLines; stats.types.json.blank += blankLines; stats.types.json.comments += commentLines;
            } else if (ext === '.md') {
              stats.types.md.files++; stats.types.md.loc += totalLines; stats.types.md.blank += blankLines; stats.types.md.comments += commentLines;
            } else if (ext === '.html') {
              stats.types.html.files++; stats.types.html.loc += totalLines; stats.types.html.blank += blankLines; stats.types.html.comments += commentLines;
            } else if (ext === '.css') {
              stats.types.css.files++; stats.types.css.loc += totalLines; stats.types.css.blank += blankLines; stats.types.css.comments += commentLines;
            } else if (ext === '.py') { stats.flags.hasPy = true; }
            else if (ext === '.java') { stats.flags.hasJava = true; }
            else if (ext === '.c' || ext === '.cpp') { stats.flags.hasC = true; }
            else if (ext === '.go') { stats.flags.hasGo = true; }

          } catch(e) {}
        } else {
          // Send filename to analyzer even if file is large/hidden (e.g. .env)
          secAnalyzer.analyzeFile(fullPath, null);
        }
      }
    }
    return dirSize;
  };

  traverse(cwd);

  stats.largestFiles.sort((a, b) => b.size - a.size);
  stats.largestFiles = stats.largestFiles.slice(0, 5);
  
  stats.largestFolders.sort((a, b) => b.size - a.size);
  stats.largestFolders = stats.largestFolders.slice(0, 5);

  const secResults = secAnalyzer.getResults();

  // Project Detection
  const detections = [];
  if (depResults.hasPackageJson) detections.push({ name: 'Node.js', confidence: 'High' });
  
  let pkgStr = '';
  try { pkgStr = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'); } catch(e){}
  
  if (pkgStr.includes('"react"')) detections.push({ name: 'React', confidence: 'High' });
  if (pkgStr.includes('"next"')) detections.push({ name: 'Next.js', confidence: 'High' });
  if (pkgStr.includes('"express"')) detections.push({ name: 'Express', confidence: 'High' });
  if (pkgStr.includes('"vue"')) detections.push({ name: 'Vue', confidence: 'High' });
  if (pkgStr.includes('"@angular/core"')) detections.push({ name: 'Angular', confidence: 'High' });

  if (fs.existsSync(path.join(cwd, 'requirements.txt')) || stats.flags.hasPy) detections.push({ name: 'Python', confidence: 'High' });
  if (fs.existsSync(path.join(cwd, 'pom.xml')) || stats.flags.hasJava) detections.push({ name: 'Java', confidence: 'High' });
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) detections.push({ name: 'Rust', confidence: 'High' });
  if (fs.existsSync(path.join(cwd, 'go.mod')) || stats.flags.hasGo) detections.push({ name: 'Go', confidence: 'High' });
  if (stats.flags.hasC) detections.push({ name: 'C/C++', confidence: 'Medium' });

  if (detections.length === 0) detections.push({ name: 'Unknown', confidence: 'Low' });

  Logger.stopSpinner(true, 'Analysis complete.');

  const reportData = {
    timestamp: new Date().toISOString(),
    detections,
    stats,
    dependency: depResults,
    quality: qualResults,
    security: secResults
  };

  ScannerRenderer.render(reportData, options);
}

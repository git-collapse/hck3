/**
 * @file aiRenderer.js
 * @description Renders AI advice to the terminal dashboard cleanly.
 */

import { Theme } from '../utils/logger.js';

export class AiRenderer {
  static printDashboard(advice) {
    console.log('\n' + Theme.primary.bold('================================================'));
    console.log(Theme.primary.bold('              AI SYSTEM ADVISOR                 '));
    console.log(Theme.primary.bold('================================================\n'));

    // Scoring
    const sColor = advice.score === 'Excellent' || advice.score === 'Good' ? Theme.success : (advice.score === 'Fair' ? Theme.warning : Theme.error);
    console.log(Theme.secondary.bold('┌ Health Score'));
    console.log(`│ Status: ${sColor.bold(advice.score)}`);
    console.log(`│ ${advice.scoreReason}`);
    console.log('└\n');

    // CPU
    this.printSection('CPU Analysis', advice.cpu);

    // Memory
    this.printSection('Memory Analysis', advice.memory);

    // Disk
    this.printSection('Disk Analysis', advice.disk);

    // Environment
    this.printSection('Environment Analysis', advice.environment);

    // Developer Advice
    this.printSection('Developer Advice', advice.developer);

    // Project Advice
    this.printSection('Project Advice', advice.project);

    // Recommendations
    console.log(Theme.secondary.bold('┌ Recommendations'));
    if (advice.recommendations.length === 0) {
      console.log(`│ ${Theme.success('✔ System is optimal. No recommendations.')}`);
    } else {
      // Sort HIGH -> MEDIUM -> LOW
      const order = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      advice.recommendations.sort((a, b) => order[a.priority] - order[b.priority]);
      
      advice.recommendations.forEach(r => {
        let color = Theme.info;
        if (r.priority === 'HIGH') color = Theme.error;
        if (r.priority === 'MEDIUM') color = Theme.warning;
        
        console.log(`│ ${color(`[${r.priority}]`)} ${r.text}`);
      });
    }
    console.log('└\n');
  }

  static printSection(title, lines) {
    console.log(Theme.secondary.bold(`┌ ${title}`));
    
    if (lines.length > 0) {
      // Look for negative keywords to color icons
      const isBad = lines.join(' ').match(/(critical|overload|high|duplicate|missing|vulnerabilit)/i);
      const icon = isBad ? Theme.error('❌') : Theme.success('✅');
      
      console.log(`│ ${icon}`);
      lines.forEach(l => console.log(`│ ${l}`));
    } else {
      console.log(`│ No notable insights.`);
    }
    console.log('└\n');
  }
}

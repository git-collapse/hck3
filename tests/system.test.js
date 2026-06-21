import assert from 'assert';
import { SystemService } from '../src/services/systemService.js';

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  \x1b[32m✔\x1b[0m  ${name}`); passed++; }
  catch(e) { console.error(`  \x1b[31m✖\x1b[0m  ${name}\n     ${e.message}`); failed++; }
}
function section(t) { console.log(`\n\x1b[36m── ${t} ──\x1b[0m`); }

section('SystemService.getGeneralInfo');
test('has all required keys', () => {
  const g = SystemService.getGeneralInfo();
  for (const k of ['osName','osRelease','platform','architecture',
    'hostname','currentUser','homeDirectory','cwd','nodeVersion','pid'])
    assert.ok(k in g, `Missing: ${k}`);
});
test('nodeVersion starts with v', () => {
  assert.ok(SystemService.getGeneralInfo().nodeVersion.startsWith('v'));
});

section('SystemService.getCpuInfo');
test('count is a positive number', () => {
  assert.ok(SystemService.getCpuInfo().count > 0);
});
test('architecture is non-empty string', () => {
  const a = SystemService.getCpuInfo().architecture;
  assert.ok(typeof a === 'string' && a.length > 0);
});

section('SystemService.getMemoryInfo');
test('total > 0', () => assert.ok(SystemService.getMemoryInfo().total > 0));
test('total >= free', () => {
  const m = SystemService.getMemoryInfo();
  assert.ok(m.total >= m.free);
});
test('usagePercent in [0,100]', () => {
  const p = SystemService.getMemoryInfo().usagePercent;
  assert.ok(p >= 0 && p <= 100, `Got ${p}`);
});

section('SystemService.getNetworkInfo');
test('returns an array', () => {
  assert.ok(Array.isArray(SystemService.getNetworkInfo()));
});
test('each entry has required fields', () => {
  for (const n of SystemService.getNetworkInfo())
    for (const k of ['interface','family','address','internal','mac'])
      assert.ok(k in n, `Missing field: ${k}`);
});

section('SystemService.getHealthSummary');
test('returns score string and valid rating', () => {
  const info = SystemService.getSystemInfo();
  const h = SystemService.getHealthSummary(
    info.memory, info.cpu, info.system, info.node);
  assert.ok(typeof h.score === 'string');
  assert.ok(['Excellent','Good','Average','Needs Attention'].includes(h.rating),
    `Bad rating: ${h.rating}`);
});

section('SystemService.getSystemInfo');
test('has all top-level sections', () => {
  const all = SystemService.getSystemInfo();
  for (const k of ['general','cpu','memory','network','system','node'])
    assert.ok(k in all, `Missing section: ${k}`);
});

console.log(`\n  Results: \x1b[32m${passed} passed\x1b[0m, ${
  failed > 0 ? '\x1b[31m' : ''}${failed} failed\x1b[0m\n`);
if (failed > 0) process.exit(1);

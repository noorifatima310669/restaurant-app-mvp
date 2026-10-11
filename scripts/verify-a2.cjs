const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'A2', 'verification');
fs.mkdirSync(dir, { recursive: true });
const npm = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const expo = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
const checks = [
  ['frontend-tests', npm, ['run', 'test:frontend']],
  ['backend-tests', npm, ['test', '--prefix', 'server']],
  ['lint', npm, ['run', 'lint']],
  ['syntax-imports', npm, ['run', 'check:syntax']],
  ['expo-dependencies', expo, ['install', '--check']],
  ['web-export', expo, ['export', '--platform', 'web', '--output-dir', 'dist/web']],
  ['android-export', expo, ['export', '--platform', 'android', '--output-dir', 'dist/android']],
];
const results = [];
for (const [name, executable, args] of checks) {
  console.log(`Running ${name}...`);
  const result = spawnSync(process.execPath, [executable, ...args], { cwd: root, env: { ...process.env, CI: '1', NO_COLOR: '1' }, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const output = (result.stdout || '') + (result.stderr || '');
  fs.writeFileSync(path.join(dir, name + '.txt'), output);
  results.push({ name, exitCode: result.status, passed: result.status === 0,
    tests: Number(output.match(/tests (\d+)/)?.[1] || 0),
    passedTests: Number(output.match(/pass (\d+)/)?.[1] || 0),
  });
  console.log(`${name}: ${result.status === 0 ? 'PASS' : 'FAIL'}${result.error ? ' ' + result.error.message : ''}`);
  if (result.status !== 0) console.log(output.slice(-4000));
}
fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ date: '2026-10-11', timezone: 'Asia/Karachi', results }, null, 2) + '\n');
console.log('Executed total tests:', results.reduce((sum, result) => sum + result.tests, 0));
process.exitCode = results.every(result => result.passed) ? 0 : 1;

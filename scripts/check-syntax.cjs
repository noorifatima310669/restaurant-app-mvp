const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
let count = 0;
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') scan(file);
    else if (/\.[cm]?js$/.test(file)) {
      const tree = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
      for (const node of tree.program.body) {
        const specifier = node.source?.value;
        if (specifier?.startsWith('.')) {
          const target = path.resolve(path.dirname(file), specifier);
          if (!['', '.js', '.json', '/index.js'].some(suffix => fs.existsSync(target + suffix))) throw new Error(`Missing import in ${file}: ${specifier}`);
        }
      }
      count++;
    }
  }
}
scan('src'); scan('server');
parser.parse(fs.readFileSync('App.js', 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
console.log(`Syntax/import checks passed: ${count + 1} JavaScript files.`);

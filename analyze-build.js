const fs = require('fs');
const path = require('path');

function analyzeDirectory(dir, depth = 0) {
  try {
    const items = fs.readdirSync(dir);
    console.log('  '.repeat(depth) + '📁 ' + path.basename(dir) + '/');

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        analyzeDirectory(fullPath, depth + 1);
      } else {
        const icon = item === 'index.html' ? '🎯' :
          item.endsWith('.js') ? '⚡' :
            item.endsWith('.css') ? '🎨' : '📄';
        console.log('  '.repeat(depth + 1) + icon + ' ' + item);
      }
    });
  } catch (e) {
    console.log('  '.repeat(depth) + '❌ ' + dir + ' - ' + e.message);
  }
}

console.log('=== ANÁLISE DA ESTRUTURA DO BUILD ===');
console.log('Diretório de output:', process.cwd() + '\\dist');
analyzeDirectory('dist');

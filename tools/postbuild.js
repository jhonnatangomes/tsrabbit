#!/usr/bin/env node
const fs = require('fs');
const shebang = '#!/usr/bin/env node';
const binPath = './bin/index.js';
const entryFile = fs.readFileSync(binPath).toString();
if (!entryFile.startsWith(shebang)) {
  fs.writeFileSync(binPath, shebang + '\n' + entryFile);
}

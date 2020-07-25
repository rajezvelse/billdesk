const fs = require('fs-extra');


fs.moveSync('build', 'dist/ui', { overwrite: true });
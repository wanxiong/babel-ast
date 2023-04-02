const { transformFileSync } = require('@babel/core');
const inserConsolePlugin = require('../babel-plugin1');
const path = require('path');

const { code } = transformFileSync(path.join(__dirname, './sourceCode.js'), {
  plugins: [inserConsolePlugin],
  parserOpts: {
      sourceType: 'unambiguous',
      plugins: ['jsx']       
  }
});

console.log(code);
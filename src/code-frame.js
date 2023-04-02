const { codeFrameColumns } = require('@babel/code-frame');
const { transformFileSync } = require('@babel/core');
const path = require('path')

const { code } = transformFileSync(path.join(__dirname, './runTest/codeFrameCode.js'), {
  parserOpts: {
      sourceType: 'unambiguous',
      plugins: ['jsx']       
  }
});

const res = codeFrameColumns(code, {
  start: { line: 2, column: 1 },
  end: { line: 5, column: 1 },
}, {
  highlightCode: true,
  message: '这里出错了'
});

console.log(res);
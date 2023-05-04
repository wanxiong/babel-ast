
const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');
const consolePlugin = require('./console-plugin');


const str = fs.readFileSync(path.join(__dirname, './test-code.tsx'), {
    encoding: 'utf-8'
})


const astCode = parser.parse(str, {
    plugins: ['jsx', 'typescript'],
    sourceType: 'unambiguous'
})

const { code } = transformFromAstSync(astCode, str, {
    plugins: [[consolePlugin, {
        windowKeywords: 'DEBUG',
        // isDev: true
    }]]
})


console.log(code)

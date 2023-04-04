
const importModule = require('@babel/helper-module-imports');
const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');
const documentPlugin = require('./docs-plugin');
 

const str = fs.readFileSync(path.join(__dirname, './test-code.tsx'), {
    encoding: 'utf-8'
})


const astCode = parser.parse(str, {
    plugins: ['jsx', 'typescript'],
    sourceType: 'unambiguous'
})

const { code} = transformFromAstSync(astCode, str, {
    plugins: [[documentPlugin, {
        outputDir: path.resolve(__dirname)
    }]]
})


console.log(code)

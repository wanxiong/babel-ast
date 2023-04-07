
const importModule = require('@babel/helper-module-imports');
const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');
const confPlugin = require('./conf-plugin');
const confPlugin1 = require('./compress-plugin');
 

const str = fs.readFileSync(path.join(__dirname, './test-code.tsx'), {
    encoding: 'utf-8'
})


const str1 = fs.readFileSync(path.join(__dirname, './test1-code.tsx'), {
    encoding: 'utf-8'
})


const astCode = parser.parse(str, {
    plugins: ['jsx', 'typescript'],
    sourceType: 'unambiguous'
})

const astCode1 = parser.parse(str1, {
    plugins: ['jsx', 'typescript'],
    sourceType: 'unambiguous'
})

transformFromAstSync(astCode, str, {
    plugins: [[confPlugin, {
        outputDir: path.resolve(__dirname)
    }]]
})


const { code} = transformFromAstSync(astCode1, str1, {
    plugins: [[confPlugin1, {
        outputDir: path.resolve(__dirname)
    }]]
})

console.log(code)

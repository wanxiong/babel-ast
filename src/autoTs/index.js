 const { transformFromAstSync } = require('@babel/core');
 const  parser = require('@babel/parser');
 const fs = require('fs');
 const path = require('path');
 const TestPlugin = require('./ts-plugin');
 const Test1Plugin = require('./tsUnion-plugin');
 
const str = fs.readFileSync(path.join(__dirname, './test-code.tsx'), {
    encoding: 'utf-8'
})

const str1 = fs.readFileSync(path.join(__dirname, './test1-code.tsx'), {
    encoding: 'utf-8'
})

const astCode = parser.parse(str, {
    plugins: ['typescript'],
    sourceType: 'unambiguous'
})

const astCode1 = parser.parse(str1, {
    plugins: ['typescript'],
    sourceType: 'unambiguous'
})

const { code} = transformFromAstSync(astCode, str, {
    plugins: [[TestPlugin, {
        fnName: 'intl'
    }]]
})

 transformFromAstSync(astCode1, str1, {
    plugins: [[Test1Plugin, {
        fnName: 'intl'
    }]]
})


// console.log(code)
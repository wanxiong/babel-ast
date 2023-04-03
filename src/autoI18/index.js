
/**
 * 引入 tracker 模块。如果已经引入过就不引入，没有的话就引入，并且生成个唯一 id 作为标识符
 * 对所有函数在函数体开始插入 tracker 的代码
 * */ 

 const importModule = require('@babel/helper-module-imports');
 const { transformFromAstSync } = require('@babel/core');
 const  parser = require('@babel/parser');
 const fs = require('fs');
 const path = require('path');
 const i18Plugin = require('./i18-plugin');
 
 // 思路分析
 // 要转换的是字符串，主要是 StringLiteral 和 TemplateLiteral 节点，把它们替换成从资源包取值的形式

 // 1.如果没有引入 intl 模块，就自动引入，并且生成唯一的标识符，不和作用域的其他声明冲突
 // 2.把字符串和模版字符串替换为 intl.t 的函数调用的形式
 // 3.把收集到的值收集起来，输出到一个资源文件中

const str = fs.readFileSync(path.join(__dirname, './test-code.tsx'), {
    encoding: 'utf-8'
})

const astCode = parser.parse(str, {
    plugins: ['jsx'],
    sourceType: 'unambiguous'
})

const { code} = transformFromAstSync(astCode, str, {
    plugins: [[i18Plugin, {
        fnName: 'intl',
        moduleName: 'intl',
        ignoreComment: 'i18n-disable' , // 忽略i18生成
        outputDir: path.resolve(__dirname, './output')
    }]]
})


console.log(code)

/**
 * 引入 tracker 模块。如果已经引入过就不引入，没有的话就引入，并且生成个唯一 id 作为标识符
 * 对所有函数在函数体开始插入 tracker 的代码
 * */ 

const importModule = require('@babel/helper-module-imports');
const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');
const autoTrackPlugin = require('./auto-track-plugin');

// 先判断模块是否引入过， 在Program根节点通过path.traverse来遍历 importDeclaration
// 如果引入了 tracker 模块，就记录 id 到 state,并用 path.stop 来终止后续遍历
// 没有就引入 tracker 模块，用 generateUid 生成唯一 id，然后放到 state。
// 当然 default import 和 namespace import 取 id 的方式不一样，需要分别处理下
// 我们把 tracker 模块名作为参数传入，通过 options.trackerPath 来取

// 函数插桩 ClassMethod、ArrowFunctionExpression、FunctionExpression、FunctionDeclaration 这些节点
// 当然有的函数没有函数体，这种要包装一下，然后修改下 return 值。如果有函数体

const sourceCode = fs.readFileSync(path.join( __dirname, './test-code.ts') , {
  encoding: 'utf-8'
})

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
})

// 如果模块已经导入了，部分函数已经卖点了，还得去重，暂没空去实现
const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[autoTrackPlugin, {
    trackerPath: 'tracker'
  }]]
})


console.log(code);
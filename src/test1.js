const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
// import template from "@babel/template";
const types = require('@babel/types');
// import { codeFrameColumns } from "@babel/code-frame";

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;


const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
})
// console.log(ast)
// traverse(ast, {
//   // 上下文自己额外传递的一些参数
//   CallExpression(path, state) {
//     // console.log(state)
//     if (
//         types.isMemberExpression(path.node.callee) && 
//         path.node.callee.object.name === 'console'  &&
//         ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name) 
//       ) {
//         // 是console.xxxx
//         const { line, column } = path.node.loc.start;
//         path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
//     }
//   }
// })

// 精简一下
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

traverse(ast, {
  // 上下文自己额外传递的一些参数
  CallExpression(path, state) {
    // console.log(state)
    // const calleeName = generate(path.node.callee).code;
    // 其实这里不用自己调用 generate，path 有一个 toString 的 api，就是把 AST 打印成代码输出的。
    const calleeName = path.get('callee').toString()
    if ( targetCalleeName.includes(calleeName) ) {
        // 是console.xxxx
        const { line, column } = path.node.loc.start;
        path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
    }
  }
})


const { code, map } = generate(ast);

console.log(code);
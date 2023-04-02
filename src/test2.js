const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;
const types = require('@babel/types');
// import { codeFrameColumns } from "@babel/code-frame";

// 变换
// <div>{[console.log(111)]}</div>
// <div>{[console.log('filename.js(11,22)'), console.log(111)]}</div>

// 把 console.打印的前面在加插入一条console

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
    if (path.node.isNew) {
      return
    }
    // console.log(state)
    // const calleeName = generate(path.node.callee).code;
    // 其实这里不用自己调用 generate，path 有一个 toString 的 api，就是把 AST 打印成代码输出的。
    const calleeName = path.get('callee').toString()

    if ( targetCalleeName.includes(calleeName) ) {
        // 是console.xxxx
        const { line, column } = path.node.loc.start;
        const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)()
        newNode.isNew = true;
        if (path.findParent(path => path.isJSXElement() )) {
          path.replaceWith(types.arrayExpression([newNode, path.node]))
          // 新增的节点跳过访问
          path.skip();
        } else {
          // 换一种非template生成的写法，略显复杂
          const newCode = types.callExpression(
            types.memberExpression(
              types.identifier('console'),
              types.identifier('log')
            ),
            [types.stringLiteral(`"filename: (${line}, ${column})"`)]
          )
          newCode.isNew = true;
          path.insertBefore(newCode)
          
        }
    }
  }
})


const { code, map } = generate(ast);

console.log(code);
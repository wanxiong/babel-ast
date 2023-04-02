// babel 插件的形式就是函数返回一个对象，对象有 visitor 属性。

const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

module.exports = function({types, template}, options) {
  return {
    visitor: {
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
    },
  };
}
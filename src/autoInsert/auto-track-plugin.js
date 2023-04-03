const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');
const generate = require('@babel/generator').default;


// 函数体内是否已经调用了方法，如果调用了，就不需要重复执行了
const hasCall = (path, options) => {
  let isHas = false;
  path.traverse({
    ExpressionStatement (curPath) {
      const { name } = curPath.get('expression.callee').node
      if (options.trackerPath === name) {
        isHas = true;
        curPath.stop()
      }
    }
  })

  return isHas
}

const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);
  return {
    visitor: {
      Program: {
        enter (path, state) {
          path.traverse({
            ImportDeclaration(curPath) {
              // 获取 import xx from 'xxx' 中的 'xxx'
              const importPath = curPath.get('source').node.value
              if (importPath === options.trackerPath) {
                // 模块存在
                // 获取 import xx from 'xxx' 中的 xx是啥
                const specifierPath = curPath.get('specifiers.0');
                if (specifierPath.isImportSpecifier()) { 
                  // 如果是 import { xx } from 'xxx' 
                  // state存储状态
                  state.trackerImportId = specifierPath.toString();
                } else if (specifierPath.isImportDefaultSpecifier()) {
                  // 如果是 import xx  from 'xxx'
                  // 说明已经引入了模块 import _tracker2 from "tracker"; 不需要在对 name = _tracker2
                  state.trackerImportId = specifierPath.toString();
                } else if (specifierPath.isImportNamespaceSpecifier()) {
                  // 如果是 import * as xx  from 'xxx
                  state.trackerImportId = specifierPath.get('local').toString();// tracker 模块的 id
                }
              }
            }
          })

          // 节点都遍历完成了，来看看state参数有没有记录trackerImportId

          if(!state.trackerImportId) {
            // 如果不存在则需要我们自己导入模块, 并且获取导入的name,因为nane会在函数内调用
            state.trackerImportId  = importModule.addDefault(path, 'tracker',{
                nameHint: path.scope.generateUid('tracker')
            }).name;
          } 
          // ast代码生成
          state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();// 埋点代码的 AST
        }
      },
      'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {

        if (hasCall(path, options)) {
          path.skip()
          return
        }

        // 获取函数体内容
        const bodyPath = path.get('body');
        if (bodyPath.isBlockStatement()) {
          // 如果是函数体
          // 插入我们记录的代码 
          bodyPath.node.body.unshift(state.trackerAST);
        } else {
          // 例如 var a = () => 123
          const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
          console.log(generate(ast).code)
          bodyPath.replaceWith(ast);
        }
      }
    }
  }
})

module.exports = autoTrackPlugin
const { declare } = require('@babel/helper-plugin-utils');
const codeFrame = require('@babel/code-frame');
const generate = require('@babel/generator').default;

function resolveType(targetType) {
  const tsTypeAnnotationMap = {
      'TSStringKeyword': 'string'
  }
  switch (targetType.type) {
      case 'TSTypeAnnotation':
          return tsTypeAnnotationMap[targetType.typeAnnotation.type];
      case 'NumberTypeAnnotation': 
          return 'number';
  }
  return targetType.type
}

const TestPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      // 设置变量，以供visitor里面可以通过 state.file获取该对象来收集国际化文案
      file.set('errors', []);
    },
    visitor: {
        AssignmentExpression(path, state) {
          const errors = state.file.get('errors');
          // 要获取name的类型声明 才能对比
          // babel 提供了 scope 的 api 可以用于查找作用域中的类型声明（binding）
          // path.scope.bindings.name
          const leftBinding = path.scope.getBinding(path.get('left'));
          const leftType = resolveType(leftBinding.path.get('id').getTypeAnnotation())
          // NumberTypeAnnotation
          const rightType = resolveType(path.get('right').getTypeAnnotation())
          if (leftType !== rightType ) {
            // error: 类型不匹配
            const tmp = Error.stackTraceLimit;
            Error.stackTraceLimit = 0;
            errors.push(path.get('right').buildCodeFrameError(`${rightType} can not assign to ${leftType}`, Error));
            Error.stackTraceLimit = tmp;
          }
        },
        CallExpression(path) {
          
        
          // 先获取函数是否泛型
          const realTypes  = (path.get('typeParameters').params || []).map(item => {
            return resolveType(item);
          });

          // 先去callee 中查找函数声明
          // 再把arguments的类型和函数声明语句中的params的类型进行比较
          const fnName = path.get('callee').node.name;
          const argumentsTypes = path.get('arguments').map((item) => {
            return resolveType(item.getTypeAnnotation());
          })
          // 根据 callee 查找函数声明
          const functionDeclaration = path.scope.getBinding(fnName).path
          // 拿到声明的参数类型
          let declareParamsTypes = functionDeclaration.get('params').map((item) => {
            return resolveType(item.getTypeAnnotation()); 
          })

          // 泛型调用 add<number>(1, '2')
          if (realTypes.length) {
            const realTypeMap = {};
            functionDeclaration.node.typeParameters.params.map((item, index) => {
              realTypeMap[item.name] = realTypes[index];
          });
          } else {

          }


          argumentsTypes.forEach((type, index) => {
            if (type !== declareParamsTypes[index]) {
              // 类型不一致，报错
            }
          })

        }
    },
    post(file, state) {
      console.log(file.get('errors'));
    }
  }
})

module.exports = TestPlugin
const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');
const generate = require('@babel/generator').default;

function includeChinese(code) {
  return code
  // return new RegExp('[\u{4E00}-\u{9FFF}]', 'g').test(code)
}

function save(file, key, value) {
  const allText = file.get('allText');
  allText.push({
      key, value
  });
  file.set('allText', allText);
}

const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function getObjectExpression(t, obj) {
  const ObjectPropertyArr  = []
  Object.keys(obj || {}).forEach((k) => {
    const tempValue = obj[k]
    let newValue
    if (isObject(tempValue)) {
      newValue = tempValue.value
    } else {
      newValue = t.identifier(tempValue)
    }
    ObjectPropertyArr.push(t.objectProperty(t.identifier(k), newValue))
  })
  const ast = t.objectExpression(ObjectPropertyArr)
  return ast
}

const i18Plugin = declare((api, options, dirname) => {
  api.assertVersion(7);
  // 替换表达式
  function getReplaceExpression(path, value, intlUid) {
    let expressionParams = null
    // 如果是模板字符串  `aaa ${ title + desc} bbb ${ desc2 } ccc`;
    // 生成ast节点
    let replaceExpression = api.template.ast(`${intlUid}('${value}')`).expression
    // 如果是jsx  <div className="app" > 中的'app'
    // 并且他不是 <div className={"app"} > 这种格式 需要添加 {}
    if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p=> p.isJSXExpressionContainer())) {
      replaceExpression = api.types.JSXExpressionContainer(replaceExpression);
    }
    return replaceExpression;
  }

  return {
    pre(file) {
      // 设置变量，以供visitor里面可以通过 state.file获取该对象来收集国际化文案
      file.set('allText', []);
    },
    visitor: {
      Program: {
        enter (path, state) {
          let isImported = false
          // 处理模块
          path.traverse({
            ImportDeclaration(curPath) {
              const moduleName = curPath.node.source.value;
              // 是否导入过模块
              if ( moduleName === options.moduleName) {
                // 导入过
                isImported = true
              }
            }
          })
          // 如果没导入过模块，责自己手动添加模块
          if (!isImported) {
            // 生成唯一id
            const uid = path.scope.generateUid(options.fnName);
            // 生成节点
            const importAst = api.template.ast(`import ${uid} from '${options.moduleName}'`);
            // 插入节点
            path.node.body.unshift(importAst);
            // 记录当前的uid
            state.intlUid = uid;
          }


          // 处理字符串和模板字符串
          path.traverse({
            'StringLiteral|TemplateLiteral'(path) {
              // 如果存在注释
              if ( path.node.leadingComments ) {
                path.node.leadingComments = path.node.leadingComments.filter((comment, index) => {
                  if(comment.value.includes(options.ignoreComment)){
                    // 添加跳过标识
                    path.node.skipTransform = true
                    return false
                  }
                  return true
                })
              }

              if(path.findParent(p => p.isImportDeclaration())) {
                path.node.skipTransform = true;
              }

            }
          })
        }
      },
      StringLiteral(path, state) {
        // 有跳过标识
        if (path.node.skipTransform) {
          return 
        }
        // 获取name
        const value = path.node.value;
        // 收集文案
        save(state.file, value, value);
        // 替换表达式  'xxxx' 转成 intl('xxx')
        const replaceExpression = getReplaceExpression(path, value, state.intlUid);
        // 替换节点
        path.replaceWith(replaceExpression);
        // 跳过渲染
        path.skip();
      },
      TemplateLiteral(path, state) {
        // 有跳过标识
        if (path.node.skipTransform) {
          return;
        }
        // 模板字符串变量和字符串都取出来
        let templateMembers = [...path.node.quasis, ...path.node.expressions]
        // 根据行排个序
        templateMembers.sort((a, b) => (a.start - b.start))

        const shouldReplace = path.node.quasis.some((node) => includeChinese(node.value.raw))

        if (shouldReplace) {
          let value = ''
          const params = {}
          let slotIndex = 0;
          templateMembers.forEach((node) => {
            if (node.type === 'Identifier') {
              // 单纯的字符串 {desc2}
              const key = node.name
              params[key] = key
              value += `{${key}}`
            } else if (node.type === 'BinaryExpression') {
              // 单纯的字符串  ${ title + desc}
              key = 'slot' + slotIndex
              slotIndex++;
              params[key] = generate(node).code
              value += `{${key}}`;
            } else if (node.type === 'TemplateElement') {
              value += node.value.raw
            } else if (node.type === 'MemberExpression') {
              //   const desc4 = `aaa ${ obj.a}`;
              key = `slot${++slotIndex}`
              params[key] = generate(node).code
            }
          })
        
          // 收集文案
          save(state.file, value, value);
          // 生成参数模板
          const t = api.types;
          const objectExpression = Object.keys(params).length ?  getObjectExpression(t, params ) : null;
          // 生成表达式 intl('xxx', {})
          const _arguments = objectExpression ? [ t.stringLiteral(value), objectExpression] : [ t.stringLiteral(value)]
          const replaceExpression = t.callExpression(t.identifier(state.intlUid), _arguments)
          console.log(generate(replaceExpression).code)
          // 替换节点
          path.replaceWith(replaceExpression);
          // 跳过渲染
          path.skip();
        }

      }
    },
    post(file, state) {
      console.log('··········国际化文案·········')
      console.log(file.get('allText'))
      console.log('··········国际化文案·········')
    }
  }
})

module.exports = i18Plugin
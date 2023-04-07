const { declare } = require('@babel/helper-plugin-utils');
const generator = require('./markdown')
const fs = require('fs')
const path = require('path')
const doctrine = require('doctrine');

// path.getTypeAnnotation() 取到的类型需要做进一步的处理，比如把 TSStringKeyword 换成 string
const resolveType = (tsType) => {
    // 如果类型不存在 直接结束
    if (!tsType) {
        return;
    }
    // 可以扩展更多类型
    switch (tsType.type) {
        case 'TSStringKeyword': 
            return 'string';
        case 'TSNumberKeyword':
            return 'number';
        case 'TSBooleanKeyword':
            return 'boolean';
        case 'TSTypeReference':
            return tsType.typeName.name;
    }
    // 没写出来的 直接给他丢回去
    return tsType.type
    
}


function parseComment(commentStr) {
    if (!commentStr) {
        return;
    }

    return doctrine.parse(commentStr, {
        unwrap: true
    });
}

const autoDocumentPlugin = declare((api, options, dirname) => {
    api.assertVersion(7);

    // return {
    //     pre(file) {
    //         file.set('docs', []);
    //     },
    //     visitor: {
    //         FunctionDeclaration(path, state) {
    //             // 获取pre设置的docs对象
    //             const docs = state.file.get('docs');
    //             docs.push({
    //                 type: 'function',
    //                 name: path.get('id').toString(),
    //                 params: path.get('params').map(paramPath=> {
    //                     return {
    //                         // 获取参数名
    //                         name: paramPath.toString(),
    //                         // 获取参数类型
    //                         type: resolveType(paramPath.getTypeAnnotation())
    //                     }
    //                 }),
    //                 // 返回值的类型
    //                 return: resolveType(path.get('returnType').getTypeAnnotation()),
    //                 // 获取前面的注释
    //                 doc: path.node.leadingComments && parseComment(path.node.leadingComments[0].value)
    //             })
    //             // 把处理好的信息还原回去
    //             state.file.set('docs', docs);
    //         },
    //         ClassDeclaration (path, state) {
    //             const docs = state.file.get('docs');
    //             const classInfo = {
    //                 type: 'class',
    //                 name: path.get('id').toString(),
    //                 //构造函数info
    //                 constructorInfo: {},
    //                 // 方法
    //                 methodsInfo: [],
    //                 // 属性
    //                 propertiesInfo: []
    //             }
    //             // 注释
    //             if (path.node.leadingComments) {
    //                 classInfo.doc = parseComment(path.node.leadingComments[0].value)
    //             }
    //             docs.push(classInfo)
    //             // 遍历这个类下面的数据和节点
    //             path.traverse({
    //                 ClassProperty(path) {
    //                     // 收集起来
    //                     classInfo.propertiesInfo.push({
    //                         name: path.get('key').toString(),
    //                         type: resolveType(path.getTypeAnnotation()),
    //                         // 前后注释都收集起来 过滤掉不存在的注释
    //                         doc: [...(path.node.leadingComments || []), ...(path.node.trailingComments || [])].filter(Boolean).map((comment) => {
    //                             return parseComment(comment.value)
    //                         }).filter(Boolean)
    //                     })
    //                 },
    //                 ClassMethod(path) {
    //                     // 关键字是构造函数
    //                     if (path.node.kind === 'constructor') {
    //                         classInfo.constructorInfo = {
    //                             params: path.get('params').map(paramPath=> {
    //                                 return {
    //                                     name: paramPath.toString(),
    //                                     type: resolveType(paramPath.getTypeAnnotation()),
    //                                     doc: parseComment(path.node.leadingComments[0].value)
    //                                 }
    //                             })
    //                         }
    //                     } else {
    //                         // 其他方法
    //                         classInfo.methodsInfo.push({
    //                             name: path.get('key').toString(),
    //                             doc: parseComment(path.node.leadingComments[0].value),
    //                             params: path.get('params').map(paramPath=> {
    //                                 return {
    //                                     name: paramPath.toString(),
    //                                     type: resolveType(paramPath.getTypeAnnotation())
    //                                 }
    //                             }),
    //                             return: resolveType(path.getTypeAnnotation())
    //                         })
    //                     }
    //                 }
    //             })
    //             state.file.set('docs', docs);
    //         }
    //      },
    //      post(file) {
    //         const docs = file.get('docs');
    //         const res = generator(docs);
    //         fs.writeFileSync(path.join(options.outputDir, 'docs.md'), res);
    //     }
    // }
    return {
        pre(file) {
            file.set('errors', []);
        },
        visitor: {
            CallExpression(path, state) {
                const errors = state.file.get('errors');
                // 调用参数的类型
                const argumentsTypes = path.get('arguments').map(item => {
                    return resolveType(item.getTypeAnnotation());
                });
                const calleeName = path.get('callee').toString();
                // 根据 callee 查找函数声明
                const functionDeclarePath = path.scope.getBinding(calleeName).path;
                // 拿到声明时参数的类型
                const declareParamsTypes = functionDeclarePath.get('params').map(item => {
                    return resolveType(item.getTypeAnnotation());
                })
        
                argumentsTypes.forEach((item, index) => {
                    if (item !== declareParamsTypes[index]) {
                        // 类型不一致，报错
                    }
                });
            }
        },
        post(file) {
            console.log(file.get('errors'));
        }
    }
})

module.exports = autoDocumentPlugin
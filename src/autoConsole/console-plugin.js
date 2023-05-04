/* eslint-disable */

function isDeCode(node) {
    let log = node.scope.bindings.log;
    if (log?.path) {
        let logNode = log.path.node;
        return logNode.init?.name === 'console';
    }
    return false;
}

const createWindowDebugNode = function (types, statement, windowKeywords) {
    let newNode = types.ifStatement(
        types.memberExpression(
            types.identifier('window'),
            types.identifier(windowKeywords),
        ),
        types.blockStatement([statement]),
    );
    return newNode;
};

const consolePlugin = (api, options, dirname) => {
    const { windowKeywords = 'DEBUG', isDev = false } = options;
    const { types } = api
    if (isDev) return {};
    // const { types } = api
    return {
        visitor: {
            CallExpression(path) {
                const callee = path.get('callee').node;
                const object = callee?.object;
                const property = callee?.property;
                // console.log 出来的
                if (object?.name === 'console' && property?.name) {
                    let newNode = createWindowDebugNode(
                        types,
                        path.parent,
                        windowKeywords,
                    );
                    path.replaceWith(newNode);
                    // 替换父节点
                    path.parentPath.replaceWith(newNode);
                    // 跳过变遍历
                    path.parentPath.skip();
                    // path.skip();
                    return
                } else if (isDeCode(path)) {
                    //  const { log } = console 解构出来的
                    let newNode = createWindowDebugNode(
                        types,
                        path.parent,
                        windowKeywords,
                    );
                    path.replaceWith(newNode);
                    path.skip();
                }


                // reverse the name: JavaScript -> tpircSavaJ
            },
        },
    };
};



module.exports = consolePlugin

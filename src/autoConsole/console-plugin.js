/* eslint-disable */
// const generate = require('@babel/generator').default
// const t = require('@babel/types')

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
        types.blockStatement([types.expressionStatement(statement.node)]),
    );
    // t.ifStatement
    // t.expressionStatement()
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
                        path,
                        windowKeywords,
                    );
                    // 替换父节点
                    path.replaceWith(newNode);
                    // 跳过变遍历
                } else if (isDeCode(path)) {
                    //  const { log } = console 解构出来的
                    let newNode = createWindowDebugNode(
                        types,
                        path,
                        windowKeywords,
                    );
                    path.replaceWith(newNode);

                }
                path.skip();

            },
        },
    };
};



module.exports = consolePlugin

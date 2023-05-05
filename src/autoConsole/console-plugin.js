/* eslint-disable */
// const generate = require('@babel/generator').default
const t = require('@babel/types')

const defatlComments = 'console-disabled';

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

const isSkipDebug = function (path, comments) {
    const leadingComments = path.get('leadingComments') || []
    // 单行注释
    /*  多行注释 */
    let hasComment = Array.isArray(leadingComments) ? leadingComments.some((commentPath) => {
        const commentNode = commentPath.node
        if (commentNode.type === 'CommentLine' || commentNode.type === 'CommentBlock') {
            if (commentNode.value.trim() === comments) { return true }
        }
        return false
    }) : false

    return hasComment
}

const consolePlugin = (api, options, dirname) => {
    const { windowKeywords = 'DEBUG', isDev = false, comments = defatlComments } = options;
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
                    if (isSkipDebug(path.parentPath, comments)) return
                    let newNode = createWindowDebugNode(
                        types,
                        path,
                        windowKeywords,
                    );
                    // 替换父节点
                    path.replaceWith(newNode);
                    // 跳过变遍历
                } else if (isDeCode(path)) {
                    if (isSkipDebug(path.parentPath, comments)) return
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

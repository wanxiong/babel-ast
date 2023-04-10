const importModule = require('@babel/helper-module-imports');
const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

const visitedModules = new Set();

const IMPORT_TYPE = {
    deconstruct: 'deconstruct',
    default: 'default',
    namespace: 'namespace'
}

const EXPORT_TYPE = {
    all: 'all',
    default: 'default',
    named: 'named'
}

function isDirectory(filePath) {
    try {
        return fs.statSync(filePath).isDirectory()
    }catch(e) {}

    return false;
}

//  path 表示当前模块路径， imports 表示从什么模块引入了什么变量，exports 表示导出了什么变量
class DependencyNode {
    constructor(path = '', imports = {}, exports = []) {
        this.path = path;
        this.imports = imports;
        this.exports = exports;
        this.subModules = {};
    }
}


function resolveBabelSyntaxtPlugins (modulePath) {
    const plugins = [];
    if (['.tsx', '.jsx'].some(ext => modulePath.endsWith(ext))) {
        plugins.push('jsx');
    }

    if (['.tsx', '.ts'].some(ext => modulePath.endsWith(ext))) {
        plugins.push('typescript');
    }
    return plugins
}


function completeModulePath (modulePath) {
    const EXTS = ['.tsx','.ts','.jsx','.js'];
    if (modulePath.match(/\.[a-zA-Z]+$/)) {
        return modulePath;
    }

    function tryCompletePath (resolvePath) {
        for (let i = 0; i < EXTS.length; i ++) {
            let tryPath = resolvePath(EXTS[i]);
            if (fs.existsSync(tryPath)) {
                return tryPath;
            }
        }
    }

    function reportModuleNotFoundError (modulePath) {
        throw 'module not found: ' + modulePath;
    }

    // 是文件夹 读取文件夹下的index文件
    if (isDirectory(modulePath)) {
        const tryModulePath = tryCompletePath((ext) => path.join(modulePath, 'index' + ext));
        if (!tryModulePath) {
            reportModuleNotFoundError(modulePath);
        } else {
            return tryModulePath;
        }
    } else if (!EXTS.some(ext => modulePath.endsWith(ext))) {
        // /不存在扩展.xxxxx 试图拼接起来
        const tryModulePath = tryCompletePath((ext) => modulePath + ext);
        if (!tryModulePath) {
            // 文件不存在
            reportModuleNotFoundError(modulePath);
        } else {
            // 返回拼接好的路径
            return tryModulePath;
        }
    }
    // 返回没有问题的路径
    return modulePath;
}

// import { a, b as bb} from 'aa';
// 这种我们叫 namespace import（命名空间引入）
// import * as c from 'cc';
// 这种我们叫 default import（默认引入）
// import b from 'b';
function moduleResolver (curModulePath, moduleName) {
    let requirePath  = path.resolve(path.dirname(curModulePath), moduleName)

    // 过滤掉第三方模块
    if (requirePath.includes('node_modules')) {
        return '';
    }
    // 获取完整的路径
    requirePath =  completeModulePath(requirePath);

    if (visitedModules.has(requirePath)) {
        return '';
    } else {
        visitedModules.add(requirePath);
    }

    return requirePath;
}

function traverseJsModule(curModulePath, dependencyGraphNode, allModules) {
    let str = fs.readFileSync(curModulePath, {
        encoding: 'utf-8'
    })
    dependencyGraphNode.path = curModulePath;

    let astCode = parser.parse(str, {
        sourceType: 'unambiguous',
        plugins: [resolveBabelSyntaxtPlugins(curModulePath)]
    })

    traverse(astCode, {
        ImportDeclaration(path) {
             // 收集import 信息
             const subModulePath  = moduleResolver(curModulePath, path.get('source.value').node)

             if (!subModulePath) {
                return;
            }

             const specifierPaths = path.get('specifiers')

            dependencyGraphNode.imports[subModulePath] = specifierPaths.map((specifierPath) => {
                if(specifierPath.isImportSpecifier()) {
                    return {
                        type: IMPORT_TYPE.deconstruct,
                        imported: specifierPath.get('imported').node.name,
                        local: specifierPath.get('local').node.name
                    }
                } else if (specifierPath.isImportDefaultSpecifier()) {
                    return {
                        type: IMPORT_TYPE.default,
                        local: specifierPath.get('local').node.name
                    } 
                } else {
                    return {
                        type: IMPORT_TYPE.namespace,
                        local: specifierPath.get('local').node.name
                    }
                }
            })
            // 递归处理依赖模块
            const subModule = new DependencyNode();
            traverseJsModule(subModulePath, subModule , allModules)
            dependencyGraphNode.subModules[subModule.path] = subModule 
        },
        ExportDeclaration(path) {
            // export { aa1, aa2 }
            if(path.isExportNamedDeclaration()) {
                const specifiers = path.get('specifiers')
                dependencyGrapthNode.exports = specifiers.map((specifier) => {
                    return {
                        type: EXPORT_TYPE.named,
                        exported: specifierPath.get('exported').node.name,
                        local: specifierPath.get('local').node.name
                    }
                })
            } else if (path.isExportDefaultDeclaration()) {
                let exportName;
                const declarationPath = path.get('declaration')
                // export default b = 4;
                if(declarationPath.isAssignmentExpression()) {
                    exportName = declarationPath.get('left').toString();
                } else {
                    // export default b;
                    exportName = declarationPath.toString()
                }

                dependencyGrapthNode.exports.push({
                    type: EXPORT_TYPE.default,
                    exported: exportName
                });
            } else {
                dependencyGrapthNode.exports.push({
                    type: EXPORT_TYPE.all,
                    exported: path.get('exported').node.name,
                    source: path.get('source').node.value
                })
            }
        }
    })
    allModules[curModulePath] = dependencyGraphNode
}


function traverseModule (curModulePath) {
    const dependencyGraph = {
        root: new DependencyNode(),
        allModules: {}
    };
    traverseJsModule(curModulePath, dependencyGraph.root, dependencyGraph.allModules);

    return dependencyGraph;
}



const dependencyGraph = traverseModule(path.resolve(__dirname, './test/index.js'));
// 收集依赖关系，有了依赖图之后，就可以做进一步的处理
// 合并一些模块成 chunk graph 通过 export 和 import 的关系的分析，实现 treeshking

console.log(JSON.stringify(dependencyGraph, null, 4));
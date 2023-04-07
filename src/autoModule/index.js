const importModule = require('@babel/helper-module-imports');
const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

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

function traverseJsModule(entryPath, root, allModules) {
    let str = fs.readFileSync(entryPath, {
        encoding: 'utf-8'
    })
    root.path = entryPath;

    let astCode = parser.parse(str, {
        sourceType: 'unambiguous',
        plugins: [resolveBabelSyntaxtPlugins(entryPath)]
    })

    traverse(astCode, {
        ImportDeclaration() {},
        ExportDeclaration() {}
    })

}


module.exports = function(curModulePath) {
    const dependencyGraph = {
        root: new DependencyNode(),
        allModules: {}
    };
    traverseJsModule(curModulePath, dependencyGraph.root, dependencyGraph.allModules);

    return dependencyGraph;
}
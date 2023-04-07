const { declare } = require('@babel/helper-plugin-utils');
const fs = require('fs')
const path = require('path')

const base54 = (function(){
    var DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_";
    return function(num) {
            var ret = "";
            do {
                    ret = DIGITS.charAt(num % 54) + ret;
                    num = Math.floor(num / 54);
            } while (num > 0);
            return ret;
    };
})();

function canExistAfterCompletion(path) {
    return path.isFunctionDeclaration() || path.isVariableDeclaration({
        kind: "var"
    });
}

const confPlugin1 = declare((api, options, dirname) => {
    api.assertVersion(7);

    return {
        pre(file) {
            file.set('uid', 0);
        },
        visitor: {
            BlockStatement(path, state) {
                const statementPaths = path.get('body');
                let purge = false;
                for (let i = 0; i < statementPaths.length; i++) {
                    if (statementPaths[i].isCompletionStatement()) {
                        purge = true;
                        continue;
                    }
                    // 变量和函数声明不能删除
                    if (purge && !canExistAfterCompletion(statementPaths[i])) {
                        statementPaths[i].remove();
                    } 
                }
            }
        },
        post(file) {
            console.log(file.get('errors'));
        }
    }
})

module.exports = confPlugin1
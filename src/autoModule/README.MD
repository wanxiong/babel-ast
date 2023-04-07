### 依赖分析的功能，也就是遍历所有的模块。

### 写这个的好处一个是能够加深我们对打包工具的认识，二是当做一些独立的工具的时候，可能也需要分析模块依赖关系


### 思路分析

    1. 模块依赖分析也就是要分析 import 和 export，从入口模块开始，读取文件内容，通过 babel parser 把内容 parse 成 ast，之后通过 babel traverse 来对 AST 进行遍历。分别对 ImportDeclaration、ExportDeclaration 做处理：

    2. ImportDeclaration：收集 import 信息，确定依赖的模块和引入的变量，之后再递归处理该模块 ExportDeclaration：收集 export 信息，确定导出的变量

### 具体操作过程

    1. 读取文件内容
    2. 通过 babel parser 把文件内容 parse 成 ast
    3. 遍历 AST，对 ImportDeclaration、ExportDeclaration 分别做处理
    4. 对分析出的依赖路径进行处理，变成绝对路径，并尝试补全
    5. 递归处理分析出来的依赖路径


    如果没有后缀名的依赖路径，要分别尝试 .js、.jsx、.ts、.tsx 的路径，如果存在就补全成该路径，并且目录还要补全 index 文件名


    通过递归处理依赖模块，就可以完成依赖图的构建，我们可以保存根节点和所有模块的信息

    当处理完所有模块后，就得到了完整的 dependencyGraph
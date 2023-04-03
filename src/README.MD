


# 我们知道 babel 的编译流程分为三步：parse、transform、generate，每一步都暴露了一些 api 出来。

  1. parse 阶段有@babel/parser，功能是把源码转成 AS
  2. transform 阶段有 @babel/traverse，可以遍历 AST，并调用 visitor 函数修改 AST，修改 AST 自然涉及到 AST 的判断、创建、修改等，这时候就需要 @babel/types 了，当需要批量创建 AST 的时候可以使用 @babel/template 来简化 AST 创建逻辑。
  3. generate 阶段会把 AST 打印为目标代码字符串，同时生成 sourcemap，需要 @babel/generator 包
  4. 中途遇到错误想打印代码位置的时候，使用 @babel/code-frame 包
  5. babel 的整体功能通过 @babel/core 提供，基于上面的包完成 babel 整体的编译流程，并应用 plugin 和 preset。

# Literal 是字面量的意思

```
  数字字面量 NumericLiteral
  布尔字面量 BooleanLiteral
  ...
```

# Identifer 是标识符的意思,变量名、属性名、参数名等各种声明和引用的名字，都是Identifer


# statement 是语句，它是可以独立执行的单位

```
  break;
  continue;
  return;
  debugger;
  throw Error();
  {}
  try {} catch(e) {} finally{}
  for (let key in obj) {}
  for (let i = 0;i < 10;i ++) {}
  while (true) {}
  do {} while (true)
  switch (v){case 1: break;default:;}
  label: console.log();
  with (a){}
  ...
```


# Declaration 声明语句是一种特殊的语句，它执行的逻辑是在作用域内声明一个变量、函数、class、import、export 等

``` 
  const a = 1;
  function b(){}
  class C {}

  import d from 'e';

  export default e = 1;
  export {e};
  export * from 'e';
```

# Expression 是表达式，特点是执行完以后有返回值，这是和语句 (statement) 的区别。

```
  [1,2,3]
  a = 1
  1 + 2;
  -1;
  function(){};
  () => {};
  class{};
  a;
  this;
  super;
  a::b;

```

# Class 的语法也有专门的 AST 节点来表示。整个 class 的内容是 ClassBody，属性是 ClassProperty，方法是ClassMethod（通过 kind 属性来区分是 constructor 还是 method）



# import 分别对应 ImportSpicifier、ImportDefaultSpecifier、ImportNamespaceSpcifier

``` js

  import {c, d} from 'c';
  import a from 'a';
  import * as b from 'b';

```


### export 分别对应 ExportNamedDeclaration、ExportDefaultDeclaration、ExportAllDeclaration

``` js

  export { b, d};
  export default a;
  export * from 'c';

```


# Program & Directive

### program 是代表整个程序的节点，它有 body 属性代表程序体，存放 statement 数组，就是具体执行的语句的集合。还有 directives 属性，存放 Directive 节点，比如"use strict" 这种指令会使用 Directive 节点表示, Program 是包裹具体执行语句的节点，而 Directive 则是代码中的指令部分


#  File & Comment 

### babel 的 AST 最外层节点是 File，它有 program、comments、tokens 等属性，分别存放 Program 程序体、注释、token 等，是最外层节点

### 注释分为块注释和行内注释，对应 CommentBlock 和 CommentLine 节点



# AST 的公共属性

### type： AST 节点的类型
### start、end、loc：start 和 end 代表该节点在源码中的开始和结束下标。而 loc 属性是一个对象，有 line 和 column 属性分别记录开始和结束的行列号
### eadingComments、innerComments、trailingComments： 表示开始的注释、中间的注释、结尾的注释，每个 AST 节点中都可能存在注释，而且可能在开始、中间、结束这三种位置，想拿到某个 AST 的注释就通过这三个属性。
### extra：记录一些额外的信息，用于处理一些特殊情况。比如 StringLiteral 的 value 只是值的修改，而修改 extra.raw 则可以连同单双引号一起修改。


(ast链接)[https://astexplorer.net/]




# babel plugin 有两种格式

## 返回对象的函数，第一种是一个函数返回一个对象的格式，对象里有 visitor、pre、post、inherits、manipulateOptions 等属性

```js
  export default function(api, options, dirname) {
    return {
      inherits: parentPlugin,
      manipulateOptions(options, parserOptions) {
          options.xxx = '';
      },
      pre(file) {
        this.cache = new Map();
      },
      visitor: {
        StringLiteral(path, state) {
          this.cache.set(path.node.value, 1);
        }
      },
      post(file) {
        console.log(this.cache);
      }
    };
  } 
```
## 首先，插件函数有 3 个参数，api、options、dirname。
  1. api 里包含了各种 babel 的 api，比如 types、template 等，这些包就不用在插件里单独单独引入了，直接取来用就行。
  2. options 就是外面传入的参数
  3. dirname 是目录名（不常用）

## 返回的对象有 inherits、manipulateOptions、pre、visitor、post 等属性。

  1. inherits 指定继承某个插件，和当前插件的 options 合并，通过 Object.assign 的方式。
  2. visitor 指定 traverse 时调用的函数。
  3. pre 和 post 分别在遍历前后调用，可以做一些插件调用前后的逻辑，比如可以往 file（表示文件的对象，在插件里面通过 state.file 拿到）中放一些东西，在遍历的过程中取出来。
  4. manipulateOptions 用于修改 options，是在插件里面修改配置的方式，比如 syntaxt plugin一般都会修改 parser options：

## 对象

``` js
  export default plugin =  {
    pre(state) {
      this.cache = new Map();
    },
    visitor: {
      StringLiteral(path, state) {
        this.cache.set(path.node.value, 1);
      }
    },
    post(state) {
      console.log(this.cache);
    }
  };

```

##
``` js
  const { declare } = require('@babel/helper-plugin-utils');
  export default declare((api, options, dirname) => {
    api.assertVersion(7);

    return {
      name: 'xxxx',
      manipulateOptions (options, parserOptions) {
        parserOptions.plugins.push('xxxx')
      }
    }
  })
```
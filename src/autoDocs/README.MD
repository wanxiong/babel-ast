# 自动生成文档-函数和类生成


### 我们要处理 FunctionDeclaration 节点和 ClassDelcaration 节点
### ClassDeclaration 的处理复杂一些，要分别提取 constructor、method、properties 的信息
```text
    FunctionDelcaration：
        函数名： path.get('id').toString()
        参数： path.get('params')
        返回值类型： path.get('returnType').getTypeAnnotation()
        注释信息：path.node.leadingComments
    注释可以使用 doctrine 来 parse，支持 @xxx 的解析
```

```text
    ClassDeclaration：
        类名：path.get('id').toString()
        方法：travese ClassMethod 节点取信息（包括 constructor 和 method）
        属性： traverse ClassProperty 节点取信息
        注释信息： path.node.leadingComments
```

### 有了这些信息之后，就可以打印成文档了，打印就是拼接字符串的过程，可以支持 markdown、html、json 等格式




# 国际化文案提取


# 思路分析
 
 1. 要转换的是字符串，主要是 StringLiteral 和 TemplateLiteral 节点，把它们替换成从资源包取值的形式

 ``` js
    // 原有数据 
    const a = '中文'; 
    // 替换为：
    import intl from 'intl';
    const a = intl.t('intl1');



    // 而模版字符串也要做替换

    // 原有数据 
    const name = 'babel';
    const str = `你好 ${name}`;

    // 替换为：
    const name = 'babel';
    const str = intl.t('intl2', name);



    // 
    intl.t = function(key, ...args) {
        let index = 0;
        return bundle[locale][key].replace(/\{placeholder\}/, () => args[index++]);
    }
 ```

##  有一点需要注意的是在 jsx 中，必须带 {}

```js
    const a = <component content="content"></component>;
    
    // 转换
    import intl from 'intl';
    const a  = <component content={ intl.t('intl2') }></component>;
```
1. {} 节点叫做 JSXExpressionContainer，顾名思义，就是 jsx 中的表达式容器，用于实现插值语法
2. 再就是对于模版字符串中的表达式 ${} 要单独处理下。
3. 有的时候，确实不需要转换，我们可以支持通过注释来配置：带有 /*i18n-disable*/ 注释的字符串就忽略掉。

```js
 const a = /*i18n-disable*/'content';
```
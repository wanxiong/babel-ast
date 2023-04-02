# 自动插入代码 比如自动埋点

## 给定字符串 A文件

``` js 
  import aa from 'aa';
  import * as bb from 'bb';
  import {cc} from 'cc';
  import 'dd';

  function a () {
      console.log('aaa');
  }

  class B {
      bb() {
          return 'bbb';
      }
  }

  const c = () => 'ccc';

  const d = function () {
      console.log('ddd');
  }
```

## 转换成B文件

``` js
  import _tracker2 from "tracker";
  import aa from 'aa';
  import * as bb from 'bb';
  import { cc } from 'cc';
  import 'dd';

  function a() {
    _tracker2();

    console.log('aaa');
  }

  class B {
    bb() {
      _tracker2();

      return 'bbb';
    }

  }

  const c = () => {
    _tracker2();

    return 'ccc';
  };

  const d = function () {
    _tracker2();

    console.log('ddd');
  };

```
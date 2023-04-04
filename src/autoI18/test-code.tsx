import intl from 'intl2';
/**
 * App
 */
function App() {
    const title = 'title';
    const desc = `desc`;
    const desc2 = /*i18n-disable*/`desc`;
    const desc3 = `aaa ${ title + desc + desc2} bbb我 ${ desc2 } ccc ${ title + desc}`;

    const obj = {a: 2}
    const desc4 = `aaa ${ obj.a}`;

    const obj1 = {a: {h: 2}}
    const desc5 = `aaa ${ obj1.a.h}`;


    const desc6 = `aaa ${ obj1.a.h + desc}`;
    return (
      <div className="app" title={"测试"}>
        <h1>${title}</h1>
        <p>${desc}</p>  
        <div>
        {
            /*i18n-disable*/'中文'
        }
        {
          '哈哈'
        }
        </div>
      </div>
    );
  }
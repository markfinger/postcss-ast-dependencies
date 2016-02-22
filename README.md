# postcss-ast-dependencies

Inspects postcss ASTs for dependency identifiers.


## Install

`npm install --save postcss-ast-dependencies`


## Example

```js
import postcss from 'postcss';
import postcssAstDependencies from 'postcss-ast-dependencies';

const ast = postcss.parse(`
  @import './foo.css';

  .bar {
    background-image: url('./bar.png');
  }
`);

const deps = postcssAstDependencies(ast);

console.log(deps.map(dep => dep.source);
// ['./foo.css', './bar.png']
```


## Notes

Lists of objects are returned, where each object has the value
of the identifier as a `source` prop. Rather than simply returning
lists of strings, we use objects as it leaves open the potential
for more contextual information to be provided in a
backwards-compatible manner.
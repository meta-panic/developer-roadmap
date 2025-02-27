# Functions

Functions are a core building block in TypeScript. Functions allow you to wrap a piece of code and reuse it multiple times. Functions in TypeScript can be either declared using function declaration syntax or function expression syntax.

> Function Declaration Syntax:

```typescript
function name(param1: type1, param2: type2, ...): returnType {
  return value;
}
```

> Function Expression Syntax:

```typescript
const add = function(a: number, b: number): number {
  return a + b;
}

let result = add(1, 2);
console.log(result); // 3
```

Learn more from the following links:

- [Functions in TypeScript](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [Function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)
- [Functions declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)

export function evaluate(expression: string, data: {}) {
  return new Function("obj", `with(obj){${expression}}`)(data);
}

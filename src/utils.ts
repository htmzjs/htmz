import { type HTMZProp } from "./htmz";
import { type State } from "./state";

export function evaluate(expression: string, data: {}) {
  return new Function("obj", `with(obj){${expression};}`)(data);
}

export function evaluateReturn(expression: string, data: {}) {
  return new Function("obj", `with(obj){return ${expression};}`)(data);
}

export function stateToKeyValuePair<T extends State<{}>>(state: T) {
  return Object.entries<HTMZProp<unknown>>(state).reduce((p, [key, value]) => {
    return { ...p, [key]: value.value };
  }, {});
}

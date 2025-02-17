import { type HTMZProp } from "./htmz";
import { type Route } from "./router";
import { type State } from "./state";

export function evaluate(expression: string, data: {}) {
  return new Function("obj", `with(obj){${expression};}`)(data);
}

export function evaluateReturn(expression: string, data: {}) {
  return new Function("obj", `with(obj){return ${expression};}`)(data);
}

export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function extractValues<T extends State<{}>>(state: T) {
  return Object.entries<HTMZProp<unknown>>(state).reduce((p, [key, value]) => {
    return { ...p, [key]: value.value };
  }, {});
}

export function createRegexFromDynamicPath(path: string): RegExp {
  return new RegExp(`^${path.replace(/(:\w+)/g, "([\\w-_]+)")}$`);
}

export function extractParamNames(path: string): string[] {
  return (path.match(/:\w+/g) || []).map((param) => param.substring(1));
}
export type Params = Record<string, string>;

export function extractParams(
  paramNames: string[],
  match: RegExpMatchArray
): Params {
  const params: Params = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]!;
  });
  return params;
}

export function matchUrlToDynamicRoute(
  url: string,
  route: Route
): Route | null {
  const regex = createRegexFromDynamicPath(route.path);
  const match = url.match(regex);
  if (!match) return null;
  const paramNames = extractParamNames(route.path);
  const params = extractParams(paramNames, match);
  return {
    component: route.component,
    path: url,
    params: { ...route.params, ...params },
  };
}

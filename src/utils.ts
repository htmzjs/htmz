import { type ComponentConstructor } from "./component";
import { type State } from "./reactive";
import { type Params, type Routes } from "./router";

export type ScopedState = ReturnType<typeof createScopedState>;

export function createScopedState(scopes: State[]) {
  return new Proxy(
    {},
    {
      get(_, propertyKey) {
        let i = scopes.length;
        while (i--) {
          const state = scopes[i]!;
          const result = Reflect.get(state, propertyKey);
          if (result != undefined) return result;
        }
      },

      set(_, propertyKey, newValue) {
        let i = scopes.length;
        while (i--) {
          const state = scopes[i]!;
          const oldValue = state[propertyKey as keyof {}];
          if (oldValue == undefined) continue;
          return Reflect.set(state, propertyKey, newValue);
        }
        return false;
      },
    }
  );
}

export function evaluate(expression: string) {
  return new Function("obj = {}", `with(obj){${expression};}`);
}

export function evalReturn(expression: string) {
  return new Function("obj = {}", `with(obj){return ${expression};}`);
}

export const isFunction = (fn: Function) => !fn?.prototype;

export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function createRegexFromDynamicPath(path: string): RegExp {
  return new RegExp(`^${path.replace(/(:\w+)/g, "([\\w-_]+)")}$`);
}

export function extractParamNames(path: string): string[] {
  return (path.match(/:\w+/g) || []).map((param) => param.substring(1));
}
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

export function matchPathToDynamicRoute(
  path: string,
  route: {
    path: string;
    component: ComponentConstructor | (() => Promise<ComponentConstructor>);
    params?: Params;
  }
) {
  const regex = createRegexFromDynamicPath(route.path);
  const match = path.match(regex);
  if (!match) return null;
  const paramNames = extractParamNames(route.path);
  const params = extractParams(paramNames, match);
  return {
    component: route.component,
    path: path,
    params: { ...route.params, ...params },
  };
}

export function matchDynamicRoute(routes: Routes, path?: string) {
  if (!path) return null;

  for (const [routePath, route] of Object.entries(routes)) {
    const result = matchPathToDynamicRoute(path, { ...route, path: routePath });
    if (!result) continue;
    return result;
  }

  return null;
}

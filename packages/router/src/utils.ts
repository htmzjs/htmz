import type * as htmz from "@htmzjs/core"
import type { Params, Path, Routes } from "."

export function extractParams(
  paramNames: string[],
  match: RegExpMatchArray
): Params {
  const params: Params = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  return params;
}

export function createRegexFromDynamicPath(path: string): RegExp {
  return new RegExp(`^${path.replace(/(:\w+)/g, "([\\w-_]+)")}$`);
}

export function extractParamNames(path: string): string[] {
  return (path.match(/:\w+/g) || []).map((param) => param.substring(1));
}

export function matchPathToDynamicRoute(
  path: string,
  route: {
    path: string;
  } & Routes[Path]
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


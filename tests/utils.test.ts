import { describe, expect, test } from "vitest";
import { Component, toKebabCase, type Path, type Routes } from "../src";
import { matchDynamicRoute } from "../src/utils";

describe("toKebabCase", () => {
  test(`Expect "AppRoot" to be "app-root"`, () => {
    expect(toKebabCase("AppRoot")).toBe("app-root");
  });
});

describe("matchDynamicRoute", () => {
  const path: Path = "/user/kirito/post/hello-world";
  const routes: Routes = {
    "/user/:userId/post/:postId": {
      component: Component,
    },
  };

  test(`Match path "${path}" to dynamic route "/user/:userId/post/:postId"`, () => {
    expect(matchDynamicRoute(routes, path)).toEqual({
      path: path,
      params: { userId: "kirito", postId: "hello-world" },
      component: Component,
    });
  });
});

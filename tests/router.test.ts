import { describe, expect, test } from "vitest";
import { Component, initRouter } from "../src";

describe("Router", () => {
  class AppRoot extends Component<{}> {
    constructor() {
      super({
        shadowRootMode: "none",
        template: `
        <div>App Root</div>
        <div data-router-view=".."></div>
        `,
      });
    }
  }

  class HomePage extends Component<{}> {
    constructor() {
      super({
        shadowRootMode: "none",
        template: `<h1>Home Page</div>`,
      });
    }
  }

  const app = document.createElement("div");

  initRouter(AppRoot)
    .routes({
      "/": {
        component: HomePage,
      },
    })
    .mount(app);

  test("InitRouter", () => {
    expect(app.innerHTML).toContain("<h1>Home Page</h1>");
  });
});

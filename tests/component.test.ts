import { describe, expect, test } from "vitest";
import { Component, init } from "../src";

describe("Serializable", () => {
  const app = document.createElement("div");
  app.innerHTML = /*html*/ `<div data-component="MyComponent"></div>`;

  class MyComponent extends Component<{}> {
    constructor() {
      super({
        serializable: true,
        shadowRootMode: "open",
        template: "<h1>My Component</h1>",
      });
    }
  }

  init(app)
    .config({ deleteDirectives: false })
    .components({ MyComponent })
    .walk();

  test("should serialize shadow DOM content", () => {
    const serializedHTML = app.getHTML({ serializableShadowRoots: true });

    expect(serializedHTML).toBe(
      /*html*/ `<div data-component="MyComponent"><my-component><template shadowrootmode="open" shadowrootserializable=""><h1>My Component</h1></template></my-component></div>`
    );
  });
});

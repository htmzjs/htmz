import { describe, expect, test } from "vitest";
import { Component, Define } from "../src";

describe("Decorator", () => {
  @Define()
  class AppRoot extends Component<{}> {
    constructor() {
      super();
    }
  }

  test("Constructor name should not change when using class decorator", () => {
    expect(AppRoot.name).toBe("AppRoot");
  });
});

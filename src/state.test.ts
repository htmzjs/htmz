import { expect, test } from "vitest";
import { HTMZProp } from "./htmz";
import { Store } from "./state";

test("Create state", () => {
  expect(Store.setState({ name: "john", age: 25 })).toStrictEqual({
    name: new HTMZProp("name", "john"),
    age: new HTMZProp("age", 25),
  });
});

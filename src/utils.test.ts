import { expect, test } from "vitest";
import { evaluateReturn } from "./utils";

test("1 + 1 = 2", () => {
  expect(evaluateReturn("1 + 1", {})).toBe(2);
});

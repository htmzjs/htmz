import json5 from "json5"
import { interpolate, parseFunctionCall } from "../utils";
import type { Directives } from ".";

/* eslint-disable */
/* biome-ignore lint/suspicious/noExplicitAny: */
const operators: Record<string, (a: any, b: any) => boolean> = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '=': (a, b) => a === b,
  '==': (a, b) => a === b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a !== b,
  '&&': (a, b) => !!(a && b),
  '||': (a, b) => !!(a || b),
};

export default {
  if: ({ value, watch, scopedState }) => {
    const [condition, func] = value?.split(/\s*;\s*/) ?? ["false", ""];
    const [a, o, b] = condition.split(/\s+/)

    watch(() => {
      const opA = json5.parse(interpolate(a, scopedState))
      const opB = json5.parse(interpolate(b, scopedState))

      const bool = operators[o](opA, opB) ?? false

      if (!bool) return

      const [fnName, fnArgs] = parseFunctionCall(func)
      const fn = scopedState[fnName as keyof object] as (() => void)
      fn.apply(scopedState, fnArgs)

    });
  }
} as Directives

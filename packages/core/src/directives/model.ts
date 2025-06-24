import { interpolate } from "../utils";
import type { Directives } from "."

export default {
  model: ({ element, value, scopedState }) => {
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      Reflect.set(scopedState, interpolate(value, scopedState), target.value)
    };

    const inputElement = element as HTMLInputElement;
    inputElement.value = Reflect.get(scopedState, interpolate(value, scopedState))

    element.addEventListener("input", handler);
  }
} as Directives

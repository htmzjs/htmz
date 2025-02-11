import type { HTMZPropRecord } from "./htmz";
import { HTMZProp } from "./htmz";

export class Store {
  static setState<T extends {}>(state: T | (() => T)) {
    const newState: Record<string, unknown> = {};
    const obj = typeof state == "function" ? (state as Function)() : state;
    for (const [key, value] of Object.entries(obj)) {
      newState[key] = new HTMZProp(key, value);
    }
    return newState as HTMZPropRecord<T>;
  }
}

export type State<T extends {}> = HTMZPropRecord<T>;

type Action<T extends {}> = (
  this: HTMLElement,
  state: State<T>,
  event: unknown | null
) => void;

export type Actions<T extends {}> = Record<string, Action<T>>;

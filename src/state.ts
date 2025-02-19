import { HTMZProp } from "./htmz";

type HTMZPropRecord<T extends Record<string, unknown>> = {
  [K in keyof T]: { get value(): T[K]; set value(value: T[K]) };
};

export function setState<T extends {}>(state: T | (() => T)) {
  const newState: Record<string, unknown> = {};
  const obj = typeof state == "function" ? (state as Function)() : state;
  for (const [key, value] of Object.entries(obj)) {
    newState[key] = new HTMZProp(value);
  }
  return newState as HTMZPropRecord<T>;
}

export type State<T extends {}> = HTMZPropRecord<T>;

export type Action<T extends State<{}>> = (
  this: HTMLElement,
  {}: {
    state: Record<string, HTMZProp<unknown>>;
    rootState: T;
    event: unknown;
  }
) => void;

export type Actions<T extends State<{}>> = Record<string, Action<T>>;

import type { Actions } from "./state";
import { evaluate } from "./utils";

export class HTMZNode {
  handler: string[] = [];
  state;
  element;
  actions;

  constructor(
    element: HTMLElement,
    state: Record<string, unknown>,
    actions: Actions<{}>
  ) {
    this.element = element;
    this.state = state;
    this.actions = actions;
  }
}

type handler = (
  element: HTMLElement,
  state: Record<string, unknown>,
  actions: Actions<{}>
) => void;

const handlers: Record<string, handler> = {
  text: (element, state) => {
    const text = element.dataset.text ?? "";
    const textContent = evaluate(`return \`${text}\``, {
      ...state,
    });
    element.innerText = textContent;
  },
  if: (element, state, actions) => {
    const value = element.dataset.if;
    const [condition, func] = value!.split(";") ?? ["false", ""];
    const [functionName] = func!.trim().split("(");
    const action = actions[functionName!];
    if (!action) return;
    evaluate(`if(${condition})${func}`, {
      [functionName!]: action.bind(element)(state, null),
      ...state,
    });
  },
};

export class HTMZProp<T> {
  private nodes = new Map<HTMZNode, HTMZNode>();
  private _value;
  private key;

  constructor(key: string, value: T) {
    this._value = value;
    this.key = key;
  }

  addNode(node: HTMZNode) {
    this.nodes.set(node, node);
    this.render(node);
  }

  render({ element, handler, state, actions }: HTMZNode) {
    for (const key of handler) {
      const handler = handlers[key];
      if (!handler) continue;
      handler(element, state, actions);
    }
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    if (value == this.value) return;
    this._value = value;
    for (const [element] of this.nodes) {
      element.state[this.key] = value;
      this.render(element);
    }
  }
}

export type HTMZPropRecord<T extends Record<string, unknown>> = {
  [K in keyof T]: HTMZProp<T[K]>;
};

import type { InitHandler } from "./handler";
import { initHandlers } from "./handler";
import type { Actions, State } from "./state";
import { evaluate } from "./utils";

export class HTMZNode {
  handlerKeys: string[] = [];
  state;
  stateValue;
  element;
  actions;

  constructor(
    element: HTMLElement,
    state: Record<string, HTMZProp<unknown>>,
    stateValue: Record<string, unknown>,
    actions: Actions<{}>
  ) {
    this.element = element;
    this.state = state;
    this.stateValue = stateValue;
    this.actions = actions;
  }
}

type handler = (node: HTMZNode) => void;

const handlers: Record<string, handler> = {
  text: ({ element, stateValue }) => {
    const text = element.dataset.text ?? "";
    const textContent = evaluate(`return \`${text}\``, {
      ...stateValue,
    });
    element.innerText = textContent;
  },
  if: ({ element, state, stateValue, actions }) => {
    const value = element.dataset.if;
    const [condition, func] = value!.split(";") ?? ["false", ""];
    const [functionName] = func!.trim().split("(");
    const action = actions[functionName!];
    if (!action) return;
    evaluate(`if(${condition})${func}`, {
      [functionName!]: action.bind(element)(state, null),
      ...stateValue,
    });
  },
};

export class HTMZProp<T> {
  private nodes = new Map<HTMZNode, HTMZNode>();
  private _value;
  private key;
  handlers: Record<string, handler> = {};

  constructor(key: string, value: T) {
    this._value = value;
    this.key = key;
  }

  addNode(node: HTMZNode) {
    this.nodes.set(node, node);
    this.render(node);
  }

  render(node: HTMZNode) {
    for (const key of node.handlerKeys) {
      let handler = handlers[key];
      handler = this.handlers[key] ?? handler;
      if (!handler) continue;
      handler(node);
    }
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    if (value == this.value) return;
    this._value = value;
    for (const [element] of this.nodes) {
      element.stateValue[this.key] = value;
      this.render(element);
    }
  }
}

export type HTMZPropRecord<T extends Record<string, unknown>> = {
  [K in keyof T]: { get value(): T[K]; set value(value: T[K]) };
};

export interface Plugin {
  key: string;
  init: InitHandler;
  handler: handler;
}

export class HTMZ {
  static initTree<T extends State<{}>>(
    element: HTMLElement,
    state: T,
    actions: Actions<T> | (() => Actions<T>),
    plugins: Plugin[] = []
  ) {
    const walker = document.createTreeWalker(element);
    const newActions =
      typeof actions == "function" ? (actions as Function)() : actions;
    const stateValue = Object.entries<HTMZProp<unknown>>(state).reduce(
      (p, [key, value]) => {
        return { ...p, [key]: value.value };
      },
      {}
    );
    const handlers = { ...initHandlers };

    for (const key in state) {
      for (const plugin of plugins) {
        handlers[plugin.key] = plugin.init;
        (state[key] as HTMZProp<unknown>).handlers[plugin.key] = plugin.handler;
      }
    }

    while (walker.nextNode()) {
      const currentNode = walker.currentNode!;

      if (currentNode instanceof HTMLElement) {
        const node = new HTMZNode(
          currentNode,
          state,
          stateValue,
          actions as {}
        );

        const watch = currentNode.dataset?.watch ?? "";
        if (watch) {
          const props = watch.split(",") ?? [];
          for (const prop of props) {
            (
              state[prop as keyof typeof state]! as unknown as HTMZProp<unknown>
            ).addNode(node);
          }
        }

        for (const [key, value] of Object.entries(currentNode.dataset)) {
          if (key.startsWith("on")) {
            const event = key as keyof GlobalEventHandlers;
            if (typeof currentNode[event] == "undefined") continue;

            const [functionName] = value?.split("(") ?? [""];
            const action = newActions[functionName!];

            if (!action) continue;
            currentNode[event] = function (event: unknown) {
              evaluate(value ?? "", {
                [functionName!]: action.bind(currentNode)(state, event),
                ...state,
              });
            };
          } else {
            const handler = handlers[key];
            if (!handler) continue;
            handler({ key, value: value ?? "" }, node);
          }
        }
      }
    }
  }
}

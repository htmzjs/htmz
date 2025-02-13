import { handlers } from "./handlers";
import { Store, type Action, type Actions, type State } from "./state";
import { evaluate, evaluateReturn, stateToKeyValuePair } from "./utils";

export class HTMZNode {
  handlerKeys: string[] = [];
  state;
  rootState;
  stateValues;
  element;
  actions;
  plugins;

  constructor(
    element: HTMLElement,
    state: Record<string, HTMZProp<unknown>>,
    rootState: Record<string, HTMZProp<unknown>>,
    stateValues: Record<string, unknown>,
    actions: Record<string, Action<{}>>,
    plugins?: Plugins
  ) {
    this.element = element;
    this.state = state;
    this.rootState = rootState;
    this.stateValues = stateValues;
    this.actions = actions;
    this.plugins = plugins;
  }
}

export class HTMZProp<T> {
  private nodes = new Map<HTMZNode, HTMZNode>();
  private _value;

  plugins: Plugins = {};

  constructor(value: T) {
    this._value = value;
  }

  addNode(node: HTMZNode) {
    this.nodes.set(node, node);
    this.update(node);
  }

  update(node: HTMZNode) {
    let i = node.handlerKeys.length;
    while (i--) {
      const key = node.handlerKeys[i] ?? "";
      const value = node.element.dataset[key] ?? "";
      let updateHandler = handlers[key]?.update;
      updateHandler = this.plugins[key]?.update ?? updateHandler;
      if (!updateHandler) continue;
      updateHandler({ key, value }, node);
    }
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    if (value == this.value) return;
    this._value = value;
    for (const [node] of this.nodes) {
      node.stateValues = stateToKeyValuePair(node.state);
      this.update(node);
    }
  }
}

export type HTMZPropRecord<T extends Record<string, unknown>> = {
  [K in keyof T]: { get value(): T[K]; set value(value: T[K]) };
};

export type handler = (
  data: { key: string; value: string },
  node: HTMZNode
) => void;

export interface PluginHandlers {
  init(data: { key: string; value: string }, node: HTMZNode): void;
  update(data: { key: string; value: string }, node: HTMZNode): void;
}

export type Plugins = Record<string, PluginHandlers>;

export class HTMZ {
  static initTree<T extends State<{}>>(
    element: HTMLElement,
    rootState: T,
    rootActions: Actions<T> | (() => Actions<T>),
    plugins?: Plugins
  ) {
    const walker = document.createTreeWalker(element);
    const actions = (
      typeof rootActions == "function"
        ? (rootActions as Function)()
        : rootActions
    ) as Actions<T>;

    if (plugins) {
      for (const key in rootState) {
        (rootState[key] as HTMZProp<unknown>).plugins = plugins;
      }
    }

    while (walker.nextNode()) {
      const currentNode = walker.currentNode! as HTMLElement & {
        state: State<{}>;
      };

      if (currentNode instanceof HTMLElement) {
        const parentState =
          (currentNode.parentElement! as HTMLElement & { state: State<{}> })
            ?.state ?? {};

        const datasetState = currentNode.dataset.state || "{}";

        const data = evaluateReturn(datasetState, {
          ...stateToKeyValuePair(rootState),
          ...stateToKeyValuePair(parentState),
        });

        currentNode.state = { ...parentState, ...Store.setState(data) };

        const state = { ...rootState, ...currentNode.state };

        const node = new HTMZNode(
          currentNode,
          state,
          rootState,
          stateToKeyValuePair(state),
          actions as {},
          plugins
        );

        const watch = currentNode.dataset.watch ?? "";
        if (watch) {
          for (const prop of watch.split(",")) {
            const state = node.state[prop as keyof typeof node.state]!;
            state.addNode(node);
          }
        }

        for (const [key, value] of Object.entries(currentNode.dataset)) {
          if (key.startsWith("on")) {
            const event = key as keyof GlobalEventHandlers;
            if (typeof currentNode[event] == "undefined") continue;

            const [functionName] = value!.split("(") ?? [""];
            const action = actions[functionName!];
            if (!action) continue;

            currentNode[event] = function (event: unknown) {
              evaluate(value!, {
                [functionName!]: action.bind(currentNode)(
                  node.state as T,
                  node.rootState as T,
                  event
                ),
                ...node.stateValues,
              });
            };
            continue;
          }

          let initHandler = handlers[key]?.init;

          if (plugins) initHandler = plugins[key]?.init ?? initHandler;
          if (!initHandler) continue;

          node.handlerKeys.push(key);
          initHandler({ key, value: value! }, node);
        }
      }
    }
  }
}

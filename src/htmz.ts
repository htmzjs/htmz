import { handlers } from "./handlers";
import { setState, type Action, type Actions, type State } from "./state";
import { evaluate, evaluateReturn, extractValues } from "./utils";

export interface ComponentConstructor {
  new (...params: any[]): HTMLElement;
  root: HTMLElement | ShadowRoot | null;
  state: State<any>;
  actions: Actions<any>;
}

const shadowRootModes = {
  closed: function (this: HTMLElement) {
    Component.root = this.attachShadow({ mode: "closed" });
  },
  open: function (this: HTMLElement) {
    Component.root = this.attachShadow({ mode: "open" });
  },
  none: function (this: HTMLElement) {
    Component.root = this;
  },
};

export class Component extends HTMLElement {
  static root: HTMLElement | ShadowRoot | null;
  static state: State<any> = {};
  static actions: Actions<State<any>> = {};

  constructor(
    {
      shadowRootMode = "closed",
      template = "",
    }: {
      shadowRootMode?: keyof typeof shadowRootModes;
      template?: string;
    } = { template: "", shadowRootMode: "closed" }
  ) {
    super();
    shadowRootModes[shadowRootMode].bind(this)();
    Component.root!.setHTMLUnsafe(template);
  }
}

export class HTMZNode {
  handlerKeys: string[] = [];
  state;
  rootState;
  stateValues;
  element;
  actions;
  components;
  plugins;

  constructor(
    element: HTMLElement,
    state: Record<string, HTMZProp<unknown>>,
    rootState: Record<string, HTMZProp<unknown>>,
    stateValues: Record<string, unknown>,
    actions: Record<string, Action<{}>>,
    components: Record<
      string,
      ComponentConstructor | (() => Promise<ComponentConstructor>)
    >,
    plugins?: Plugins
  ) {
    this.element = element;
    this.state = state;
    this.rootState = rootState;
    this.stateValues = stateValues;
    this.actions = actions;
    this.components = components;
    this.plugins = plugins;
  }
}

export class HTMZProp<T> {
  private nodes = new Map<HTMZNode, HTMZNode>();
  private _value;

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

      if (key.startsWith(":")) {
        node.element.setAttribute(
          key.substring(1),
          evaluateReturn(`\`${value!}\``, node.stateValues)
        );
        continue;
      }

      if (key.startsWith("on")) {
        const event = key as keyof GlobalEventHandlers;
        if (typeof node.element[event] == "undefined") continue;

        const [functionName] = value!.split("(") ?? [""];
        const action = node.actions[functionName!];
        if (!action) continue;

        node.element[event] = function (event: unknown) {
          evaluate(value!, {
            [functionName!]: action.bind(node.element)({
              state: node.state,
              rootState: node.rootState,
              event: event,
            }),
            ...node.stateValues,
          });
        };

        continue;
      }
      let updateHandler = handlers[key]?.update;

      if (node.plugins) {
        updateHandler = node.plugins[key]?.update ?? updateHandler;
      }

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
      node.stateValues = extractValues(node.state);
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

export interface InitTreeConfig<T extends State<{}>> {
  root: HTMLElement | ShadowRoot;
  state?: T;
  actions?: Actions<T>;
  components?: Record<
    string,
    ComponentConstructor | (() => Promise<ComponentConstructor>)
  >;
  plugins?: Plugins;
}

export function initTree<T extends State<{}>>({
  root,
  state = {} as T,
  actions = {},
  components = {},
  plugins,
}: InitTreeConfig<T>) {
  const walker = document.createTreeWalker(root);

  while (walker.nextNode()) {
    const currentNode = walker.currentNode! as HTMLElement & {
      state: State<{}>;
    };

    if (currentNode instanceof HTMLElement) {
      const parentState =
        (currentNode.parentElement! as HTMLElement & { state: State<{}> })
          ?.state ?? {};

      const datasetState = currentNode.dataset.state ?? "{}";
      const newDatasetState = datasetState
        .replace(/\}$/, `,$el,$select,$selectAll}`)
        .replace(/^\{\,/, "{");

      const data = evaluateReturn(newDatasetState, {
        ...extractValues(state),
        ...extractValues(parentState),
        $el: currentNode,
        $select: (selectors: string) => currentNode.querySelector(selectors),
        $selectAll: (selectors: string) => {
          return currentNode.querySelectorAll(selectors);
        },
      });

      delete currentNode.dataset.state;

      currentNode.state = { ...parentState, ...setState(data) };

      const newState = { ...state, ...currentNode.state };

      const node = new HTMZNode(
        currentNode,
        newState,
        state,
        extractValues(newState),
        actions as {},
        components,
        plugins
      );

      const watch = currentNode.dataset.watch ?? "";
      if (watch) {
        for (const prop of watch.split(",")) {
          const state = node.state[prop as keyof typeof node.state]!;
          state.addNode(node);
        }
      }

      const oninit = currentNode.dataset.oninit ?? "";
      if (oninit) {
        const [functionName] = oninit.split("(") ?? [""];
        const action = actions[functionName!];
        if (action) {
          evaluate(oninit, {
            [functionName!]: action.bind(currentNode)({
              state: node.state as T,
              rootState: node.rootState as T,
              event: null,
            }),
            ...node.stateValues,
          });
        }
      }

      const init = currentNode.dataset.init ?? "";
      if (init) {
        evaluate(init, currentNode.state);
      }

      for (const [key, value] of Object.entries(currentNode.dataset)) {
        if (key.startsWith(":")) {
          currentNode.setAttribute(
            key.substring(1),
            evaluateReturn(`\`${value!}\``, node.stateValues)
          );
          node.handlerKeys.push(key);
          continue;
        }

        if (key.startsWith("on")) {
          const event = key as keyof GlobalEventHandlers;
          if (typeof currentNode[event] == "undefined") continue;

          const [functionName] = value!.split("(") ?? [""];
          const action = actions[functionName!];
          if (!action) continue;

          currentNode[event] = function (event: unknown) {
            evaluate(value!, {
              [functionName!]: action.bind(currentNode)({
                state: node.state as T,
                rootState: node.rootState as T,
                event: event,
              }),
              ...node.stateValues,
            });
          };
          node.handlerKeys.push(key);
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
  return root;
}

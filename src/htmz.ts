import { type Components } from "./component";
import { handlers } from "./handlers";
import { effect, reactive, type State } from "./reactive";
import {
  createScopedState,
  evalReturn,
  evaluate,
  type ScopedState,
} from "./utils";

export type NodeWithScopes<element extends Node = HTMLElement> = element & {
  scopes?: State[];
};

export type Plugin = ({}: {
  element: HTMLElement;
  scopedState: ScopedState;
  rootState: State;
  scopes: State[];
  config: HTMZConfig;
  plugins: Plugins;
  components: Components;
}) => void;

export type Plugins = Record<string, Plugin>;

export interface HTMZConfig {
  deleteDirectives?: boolean;
  deleteScopes?: boolean;
}

const defaultHTMZConfig: HTMZConfig = {
  deleteDirectives: true,
  deleteScopes: true,
};

class HTMZ<T extends State = {}> {
  root;
  _state: T = {} as T;
  _components: Components = {};
  _plugins: Plugins = {};
  _config: HTMZConfig = defaultHTMZConfig;
  constructor(selectors: string | Node) {
    this.root =
      selectors instanceof Node ? selectors : document.querySelector(selectors);
  }

  state(...state: T[]) {
    this._state = createScopedState(state) as T;
    return this;
  }

  plugins(plugins: Plugins) {
    this._plugins = plugins;
    return this;
  }
  config(config: HTMZConfig) {
    this._config = { ...this._config, ...config };
    return this;
  }

  components(components: Components) {
    this._components = components;
    return this;
  }

  walk() {
    const walker = document.createTreeWalker(this.root!);

    while (walker.nextNode()) {
      const currentNode = walker.currentNode! as NodeWithScopes;

      if (currentNode instanceof HTMLElement) {
        const parentNode = currentNode.parentNode as NodeWithScopes;
        const parentScopes = parentNode.scopes;

        if (!currentNode.scopes) currentNode.scopes = [];
        currentNode.scopes.unshift(...(parentScopes ?? []));

        currentNode.scopes.push({
          $element: currentNode,
          $select: (selectors: string) => currentNode.querySelector(selectors),
          $selectAll: (selectors: string) =>
            currentNode.querySelectorAll(selectors),
        });

        const datasetState = currentNode.dataset.state ?? "{}";

        const data = reactive(
          evalReturn(datasetState).bind(
            createScopedState([this._state, ...currentNode.scopes])
          )()
        );

        currentNode.scopes.push(data);

        const currentScopes = currentNode.scopes;

        const scopedState = createScopedState([this._state, ...currentScopes]);

        const init = currentNode.dataset.init ?? "";
        if (init) evaluate(init).bind(scopedState)();

        if (this._config.deleteDirectives) {
          delete currentNode.dataset.state;
          delete currentNode.dataset.init;
        }

        if (this._config.deleteScopes) {
          const nextSibling = currentNode.nextElementSibling;

          if (!nextSibling?.parentNode?.isEqualNode(parentNode)) {
            delete parentNode.scopes;
          }

          if (!currentNode.firstElementChild) delete currentNode.scopes;
        }

        for (const key in currentNode.dataset) {
          if (key.startsWith(":")) {
            const value = currentNode.dataset[key] ?? "";

            effect(function () {
              currentNode.setAttribute(
                key.substring(1),
                evalReturn(`${value}`).bind(scopedState)()
              );
            });

            delete currentNode.dataset[key];
          }

          const handler = { ...handlers, ...this._plugins }[key];
          if (!handler) continue;

          handler({
            element: currentNode,
            scopedState,
            config: this._config,
            plugins: this._plugins,
            scopes: currentScopes ?? [],
            rootState: this._state,
            components: this._components,
          });

          if (this._config.deleteDirectives) {
            delete currentNode.dataset[key];
          }
        }
      }
    }
  }
}

export function init<State extends {} = {}>(selectors: string | Node) {
  return new HTMZ<State>(selectors);
}

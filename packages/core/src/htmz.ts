import json5 from "json5"

import { directives } from "./directives";
import { observe, watch } from "./reactive";
import { createScopedState, parseFunctionCall, interpolate } from "./utils";

import type { State } from "./reactive";
import type { Components } from "./component";
import type { Directives } from "./directives";

export type NodeWithScopes<element extends Node = HTMLElement> = element & {
  scopes?: State[];
};

export class HTMZ<T extends State> {
  _data: T = {} as T;
  _components: Components = {};
  _directives: Directives = {}

  root;
  constructor(root: Node) {
    this.root = root
  }

  data(...data: T[]) {
    this._data = createScopedState(data) as T;
    return this;
  }

  directives(directives: Directives) {
    this._directives = directives;
    return this;
  }

  components(components: Components) {
    this._components = components;
    return this;
  }

  walk() {
    const walker = document.createTreeWalker(this.root, Node.ELEMENT_NODE);

    while (walker.nextNode()) {
      const currentNode = walker.currentNode as NodeWithScopes;
      const parentNode = currentNode.parentNode as NodeWithScopes;

      if (!currentNode.scopes) currentNode.scopes = [];
      currentNode.scopes.unshift(...(parentNode.scopes ?? []));

      currentNode.scopes.push({
        $element: currentNode,
        $select: (selectors: string) => currentNode.querySelector(selectors),
        $selectAll: (selectors: string) =>
          currentNode.querySelectorAll(selectors),
        $el: currentNode,
        $sel: (selectors: string) => currentNode.querySelector(selectors),
        $selAll: (selectors: string) =>
          currentNode.querySelectorAll(selectors),
      });

      const data = currentNode.getAttribute("@data") ?? "{}";
      currentNode.scopes.push(observe(json5.parse(data)));

      const scopedState = createScopedState([this._data, ...currentNode.scopes])

      const init = currentNode.getAttribute("@init")
      if (init) {
        const [fnName, fnArg] = parseFunctionCall(init ?? '') || []
        const fn = scopedState[fnName as keyof object] as (() => void)
        if (fn) fn.apply(scopedState, fnArg)
      }

      for (const attribute of currentNode.attributes) {
        const { name, value } = attribute
        if (!name.startsWith("@")) continue

        if (name.startsWith("@:")) {
          watch(() => {
            currentNode.setAttribute(name.slice(2), interpolate(value, scopedState))
          })
        }

        const directive = { ...directives, ...this._directives }[name.slice(1)];
        if (!directive) continue;

        directive({
          value: value,
          element: currentNode,
          scopedState: scopedState,
          watch: watch,
          directives: this._directives,
          scopes: currentNode.scopes ?? [],
          rootState: this._data,
          components: this._components,
        });
      }
    }

    return Promise.resolve()
  }
}

export function init<State extends object = object>(
  selectors?: string | Node) {
  if (selectors === undefined) return new HTMZ<State>(document.body)

  const root = selectors instanceof Node ? selectors : document.querySelector(selectors)
  if (!root) throw new Error(`Cannot initialize, element not found for selector: ${selectors}`)
  return new HTMZ<State>(root);
}

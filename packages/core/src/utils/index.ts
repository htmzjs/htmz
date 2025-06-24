import json5 from "json5"

import type { Component, ComponentConstructor } from "../component";
import type { State } from "../reactive"

export type ScopedState = ReturnType<typeof createScopedState>;

export function createScopedState(scopes: State[]) {
  return new Proxy(
    {},
    {
      get(_, propertyKey) {
        let i = scopes.length;
        while (i--) {
          const state = scopes[i];
          const result = Reflect.get(state, propertyKey);
          if (result !== undefined) return result;
        }
      },

      set(_, propertyKey, newValue) {
        let i = scopes.length;
        while (i--) {
          const state = scopes[i];
          const oldValue = state[propertyKey as keyof object];
          if (oldValue === undefined) continue;
          return Reflect.set(state, propertyKey, newValue);
        }
        return false;
      },
    }
  );
}

export function interpolate(text: string, data: object) {
  return text.replace(/{([\w_$]+[.\w\d]*)}/g, (substring) => {
    const keys = substring.slice(1, -1).split(".")
    let value = Reflect.get(data, keys[0])
    let i = 1
    while (i < keys.length) {
      value = Reflect.get(value, keys[i])
      i++
    }
    return value
  })
}

export function parseFunctionCall(str: string): [string, []] {
  const [name, strArgs] = str.trim().split(/[()]/)
  if (!name) return ['', []]
  const args = json5.parse<[]>(`[${(strArgs).split(",").join(',')}]`)
  return [name, args]
}

export function moveChildNodes(component: Component, childNodes: NodeListOf<ChildNode>): void {
  if (childNodes.length !== 0) {
    if (!(component.root instanceof ShadowRoot)) {
      const slot = component.querySelector("slot")
      slot?.replaceWith(...childNodes)
    } else component.replaceChildren(...childNodes)
  }
}

export function defineComponent(componentConstructor: ComponentConstructor) {
  if (customElements.getName(componentConstructor)) return
  customElements.define(toKebabCase(componentConstructor.name), componentConstructor)
}

export function isClassConstructor<T extends Constructor>(arg: unknown): arg is T {
  if (typeof arg !== 'function') return false
  return 'constructor' in arg && arg.constructor.name !== "AsyncFunction"
}

export function isComponentConstructor(arg: unknown): arg is ComponentConstructor {
  return isClassConstructor<ComponentConstructor>(arg)
}

export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}


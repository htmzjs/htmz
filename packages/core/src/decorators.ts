import { observe } from "./reactive";

import type { ComponentConstructor, Component } from "./component";
import type { State } from "./reactive"

const initDataMap = new WeakMap<ComponentConstructor, State>();

export function Property<T>(value: T) {
  return (target: Component, propertyKey: string) => {
    const constr = target.constructor as ComponentConstructor;

    if (!initDataMap.has(constr)) initDataMap.set(constr, observe({}));
    const state = initDataMap.get(constr) ?? observe({})

    Reflect.set(state, propertyKey, value)

    Object.defineProperty(target, propertyKey, {
      get: () => Reflect.get(state, propertyKey),
      set(newValue: unknown) {
        Reflect.set(state, propertyKey, newValue)
      },
    });
  }
}

export function Define({ template } = { template: "" }) {
  return <T extends ComponentConstructor>(constr: T) => {
    const _data = observe({})

    const obj = {
      /* eslint-disable */
      /* @ts-ignore */
      [constr.name]: class extends constr {
        constructor() {
          super();
          Object.assign(_data, initDataMap.get(constr) ?? {})
          if (this.root && template) this.root.innerHTML = template
          this.init()
        }
        override get data() {
          return _data
        }
      },
    };

    return obj[constr.name];
  };
}

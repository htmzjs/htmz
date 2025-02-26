import { Component, type ComponentConstructor } from "./component";
import { reactive, type State } from "./reactive";

const stateMap = new WeakMap<ComponentConstructor, State>();

export function Property(target: Component<{}>, propertyKey: string) {
  const constructor = target.constructor as ComponentConstructor;

  if (!stateMap.has(constructor)) stateMap.set(constructor, reactive({}));
  const value = stateMap.get(constructor)!;

  Object.defineProperty(target, propertyKey, {
    get: () => Reflect.get(value, propertyKey),
    set(newValue: any) {
      Reflect.set(value, propertyKey, newValue);
    },
  });
}

export function Define() {
  return <T extends ComponentConstructor>(constructor: T) => {
    const obj = {
      [constructor.name]: class extends constructor {
        constructor(...params: any[]) {
          super();
          this.state = Object.assign(
            stateMap.get(constructor) ?? reactive({}),
            this.state
          );
        }
      },
    };
    return obj[constructor.name];
  };
}

const targetMap = new WeakMap<{}, Map<string | symbol, Set<Function>>>();
let activeEffect: Function | null = null;

export function effect(eff: () => void) {
  activeEffect = eff;
  eff();
  activeEffect = null;
}

function track(target: {}, key: string | symbol) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

function trigger(target: {}, key: string | symbol) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) dep.forEach((eff) => eff());
}

export function reactive<T extends {}>(target: T): T {
  if (typeof target !== "object" || target === null) return target;
  return new Proxy(target, {
    get(obj, key, receiver) {
      const result =
        obj instanceof Node
          ? obj[key as keyof T]
          : Reflect.get(obj, key, receiver);
      track(obj, key);
      return typeof result === "object" && result !== null
        ? reactive(result)
        : result;
    },
    set(obj, key, newValue, receiver) {
      const oldValue = obj[key as keyof {}] as {};
      if (obj instanceof Node) {
        (obj[key as keyof T] as unknown) = newValue;
        if (oldValue !== newValue) trigger(obj, key);
        return true;
      }
      const result = Reflect.set(obj, key, newValue, receiver);
      if (oldValue !== newValue) trigger(obj, key);
      return result;
    },
  });
}

export type State = ReturnType<typeof reactive>;

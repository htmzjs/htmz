import {
  Component,
  initTree,
  type ComponentConstructor,
  type Plugins,
} from "./htmz";
import { evaluate, evaluateReturn, toKebabCase } from "./utils";

export const handlers: Plugins = {
  component: {
    async init(
      data,
      { element, components, state, stateValues, actions, plugins }
    ) {
      const componentName = evaluateReturn(
        `\`${data.value ?? ""}\``,
        stateValues
      );

      let componentClass = components[componentName] as ComponentConstructor;
      if (!componentClass) return;

      let loading;
      if (!componentClass?.prototype) {
        const loadingClass = components[
          element.dataset.suspense ?? ""
        ] as ComponentConstructor;

        if (loadingClass) {
          if (!customElements.getName(loadingClass)) {
            customElements.define(toKebabCase(loadingClass.name), loadingClass);
          }

          loading = new loadingClass();

          const componentRoot = loadingClass.root as HTMLElement;
          const componentState = loadingClass.state;
          const componentActions = loadingClass.actions;

          Component.root = null;
          Component.state = {};
          Component.actions = {};

          initTree({
            root: componentRoot,
            state: { ...state, ...componentState },
            actions: { ...actions, ...componentActions },
            components: components,
            plugins: plugins,
          });

          element.replaceChildren(loading);
        }

        componentClass = await (componentClass as Function)();
      }

      if (!customElements.getName(componentClass)) {
        customElements.define(toKebabCase(componentClass.name), componentClass);
      }

      const component = new componentClass();

      const componentRoot = componentClass.root as HTMLElement;
      const componentState = componentClass.state;
      const componentActions = componentClass.actions;

      Component.root = null;
      Component.state = {};
      Component.actions = {};

      initTree({
        root: componentRoot,
        state: { ...state, ...componentState },
        actions: { ...actions, ...componentActions },
        components: components,
        plugins: plugins,
      });

      element.replaceChildren(component);
    },
    async update(
      data,
      { element, components, state, stateValues, actions, plugins }
    ) {
      const componentName = evaluateReturn(
        `\`${data.value ?? ""}\``,
        stateValues
      );

      let componentClass = components[componentName] as ComponentConstructor;
      if (!componentClass) return;

      if (componentName == "router-outlet") {
        delete components[componentName];
      }

      let loading;
      if (!componentClass?.prototype) {
        const loadingClass = components[
          element.dataset.suspense ?? ""
        ] as ComponentConstructor;

        if (loadingClass) {
          if (!customElements.getName(loadingClass)) {
            customElements.define(toKebabCase(loadingClass.name), loadingClass);
          }

          loading = new loadingClass();

          const componentRoot = loadingClass.root as HTMLElement;
          const componentState = loadingClass.state;
          const componentActions = loadingClass.actions;

          Component.root = null;
          Component.state = {};
          Component.actions = {};

          initTree({
            root: componentRoot,
            state: { ...state, ...componentState },
            actions: { ...actions, ...componentActions },
            components: components,
            plugins: plugins,
          });

          element.replaceChildren(loading);
        }

        componentClass = await (componentClass as Function)();
      }

      if (!customElements.getName(componentClass)) {
        customElements.define(toKebabCase(componentClass.name), componentClass);
      }

      const component = new componentClass();

      const componentRoot = componentClass.root as HTMLElement;
      const componentState = componentClass.state;
      const componentActions = componentClass.actions;

      Component.root = null;
      Component.state = {};
      Component.actions = {};

      initTree({
        root: componentRoot,
        state: { ...state, ...componentState },
        actions: { ...actions, ...componentActions },
        components: components,
        plugins: plugins,
      });

      element.replaceChildren(component);
    },
  },
  for: {
    init(data, node) {
      const template = node.element as HTMLTemplateElement;
      const [variableName, json] = data.value.split(/\s+in\s+/);

      const object = evaluateReturn(json || "[]", node.stateValues);
      const fragment = document.createDocumentFragment();

      for (const key in object) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild = content.firstElementChild as HTMLElement & {
          template: HTMLTemplateElement;
        };

        const state = firstElementChild.dataset.state || "{}";
        const newProps = `$key:${JSON.stringify(
          key
        )},${variableName}:'${JSON.stringify(object[key])}'}`;

        const newState = state.replace(/\}$/, `,${newProps}`);
        // Replace to "{" if newState start with "{,"
        firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");
        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
      }

      template.parentElement!.appendChild(fragment);
    },
    update(data, node) {
      const template = node.element as HTMLTemplateElement;
      const [variableName, json] = data.value.split(/\s+in\s+/);

      const object = evaluateReturn(json || "[]", node.stateValues);
      const fragment = document.createDocumentFragment();

      for (const key in object) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild = content.firstElementChild as HTMLElement & {
          template: HTMLTemplateElement;
        };

        const state = firstElementChild.dataset.state || "{}";
        const newProps = `$key:${JSON.stringify(
          key
        )},${variableName}:'${JSON.stringify(object[key])}'}`;

        const newState = state.replace(/\}$/, `,${newProps}`);
        // Replace to "{" if newState start with "{,"
        firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");
        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
      }

      initTree({
        root: fragment as unknown as HTMLElement,
        state: node.state,
        actions: node.actions,
        components: node.components,
        plugins: node.plugins,
      });

      function nextElementSibling() {
        return template.nextElementSibling as Element & { template: Element };
      }

      while (nextElementSibling()?.template) {
        const nextSibling = nextElementSibling();
        if (nextSibling.template.isEqualNode(template)) {
          template.nextElementSibling?.remove();
        }
      }

      template.parentElement!.appendChild(fragment);
    },
  },
  if: {
    init(data, { element, state, rootState, stateValues, actions }) {
      const value = data.value;
      const [condition, func] = value!.split(/\s*\;\s*/) ?? ["false", ""];
      const [functionName] = func!.trim().split("(");

      const action = actions[functionName!];
      if (!action) return;

      evaluate(`if(${condition})${func}`, {
        [functionName!]: action.bind(element)({
          state,
          rootState,
          event: null,
        }),
        ...stateValues,
      });
    },
    update(data, { element, state, rootState, stateValues, actions }) {
      const value = data.value;
      const [condition, func] = value!.split(/\s*\;\s*/) ?? ["false", ""];
      const [functionName] = func!.trim().split("(");

      const action = actions[functionName!];
      if (!action) return;

      evaluate(`if(${condition})${func}`, {
        [functionName!]: action.bind(element)({
          state,
          rootState,
          event: null,
        }),
        ...stateValues,
      });
    },
  },
  model: {
    init(data, node) {
      const state = node.state[data.value];
      if (!state) return;
      const element = node.element as HTMLInputElement;
      element.value = state.value as string;
      element.oninput = function (e: Event) {
        state.value = (e.target as HTMLInputElement).value;
      };
    },
    update(data, node) {},
  },
  range: {
    init(data, node) {
      const template = node.element as HTMLTemplateElement;
      const [value, variableName] = data.value.split(/\s+as\s+/);

      const limit = evaluateReturn(value ?? "", node.stateValues);
      const fragment = document.createDocumentFragment();

      let i = 0;
      while (i < limit) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild = content.firstElementChild as HTMLElement & {
          template: HTMLTemplateElement;
        };

        const state = firstElementChild.dataset.state || "{}";
        const outerRange = (node.stateValues["$range"] as number[]) ?? [0, 0];
        let newProps = `$index:${
          outerRange[0]! * limit + i
        },$range:[${i},${limit}]`;

        if (variableName) newProps += `,${variableName}: ${i}`;

        const newState = state.replace(/\}$/, `,${newProps}}`);
        // Replace to "{" if newState start with "{,"
        firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");

        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
        i++;
      }

      template.parentElement!.appendChild(fragment);
    },
    update(data, node) {
      const template = node.element as HTMLTemplateElement;
      const [value, variableName] = data.value.split(/\s+as\s+/);

      const limit = evaluateReturn(value ?? "", node.stateValues);
      const fragment = document.createDocumentFragment();

      let i = 0;
      while (i < limit) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild = content.firstElementChild as HTMLElement & {
          template: HTMLTemplateElement;
        };

        const state = firstElementChild.dataset.state || "{}";
        const outerRange = (node.stateValues["$range"] as number[]) ?? [0, 0];
        let newProps = `$index:${
          outerRange[0]! * limit + i
        },$range:[${i},${limit}]`;

        if (variableName) newProps += `,${variableName}: ${i}`;

        const newState = state.replace(/\}$/, `,${newProps}}`);
        // Replace to "{" if newState start with "{,"
        firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");

        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
        i++;
      }

      initTree({
        root: fragment as unknown as HTMLElement,
        state: node.state,
        actions: node.actions,
        components: node.components,
        plugins: node.plugins,
      });

      function nextElementSibling() {
        return template.nextElementSibling as Element & { template: Element };
      }

      while (nextElementSibling()?.template) {
        const nextSibling = nextElementSibling();
        if (nextSibling.template.isEqualNode(template)) {
          template.nextElementSibling?.remove();
        }
      }

      template.parentElement!.appendChild(fragment);
    },
  },
  text: {
    init(data, node) {
      const keys = data.value.match(/\$\{[\w-]+\}/g) ?? [];

      let i = keys.length;
      while (i--) {
        const prop = node.state[keys[i]!.replace(/[${}]/g, "")];
        if (!prop) continue;
        prop.addNode(node);
      }

      const text = data.value;
      const textContent = evaluateReturn(`\`${text}\``, node.stateValues);
      node.element.innerText = textContent;
    },
    update: (data, { element, stateValues }) => {
      const text = data.value;
      const textContent = evaluateReturn(`\`${text}\``, stateValues);
      element.innerText = textContent;
    },
  },
};

import { HTMZ, type Plugins } from "./htmz";
import { evaluate, evaluateReturn } from "./utils";

export const handlers: Plugins = {
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
  for: {
    init(data, node) {
      const template = node.element as HTMLTemplateElement;
      const [variableName, json] = data.value.split(/\s+in\s+/);

      const object = evaluateReturn(json || "[]", node.stateValues);
      const fragment = document.createDocumentFragment();

      if (typeof object == "number") {
        let i = 0;
        while (i++ < object) {
          const content = template.content.cloneNode(true) as DocumentFragment;
          const firstElementChild = content.firstElementChild as HTMLElement & {
            template: HTMLTemplateElement;
          };

          const state = firstElementChild.dataset.state || "{}";
          const newProps = `$key:${i},${variableName}:'${object}'}`;

          const newState = state.replace(/\}$/, `,${newProps}`);
          firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");
          firstElementChild.template = template;

          fragment.appendChild(firstElementChild);
        }
      } else {
        for (const key in object) {
          const content = template.content.cloneNode(true) as DocumentFragment;
          const firstElementChild = content.firstElementChild as HTMLElement & {
            template: HTMLTemplateElement;
          };

          const state = firstElementChild.dataset.state || "{}";
          const newProps = `$key:${key},${variableName}:'${object[key]}'}`;

          const newState = state.replace(/\}$/, `,${newProps}`);
          firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");
          firstElementChild.template = template;

          fragment.appendChild(firstElementChild);
        }
      }
      template.parentElement!.appendChild(fragment);
    },
    update(data, node) {
      const template = node.element as HTMLTemplateElement;
      const [variableName, json] = data.value.split(/\s+in\s+/);

      const object = evaluateReturn(json || "[]", node.stateValues);
      const fragment = document.createDocumentFragment();

      if (typeof object == "number") {
        let i = 0;
        while (i++ < object) {
          const content = template.content.cloneNode(true) as DocumentFragment;
          const firstElementChild = content.firstElementChild as HTMLElement & {
            template: HTMLTemplateElement;
          };

          const state = firstElementChild.dataset.state || "{}";
          const newProps = `$key:${i},${variableName}:'${object}'}`;

          const newState = state.replace(/\}$/, `,${newProps}`);
          firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");
          firstElementChild.template = template;

          fragment.appendChild(firstElementChild);
        }
      } else {
        for (const key in object) {
          const content = template.content.cloneNode(true) as DocumentFragment;
          const firstElementChild = content.firstElementChild as HTMLElement & {
            template: HTMLTemplateElement;
          };

          const state = firstElementChild.dataset.state || "{}";
          const newProps = `$key:${key},${variableName}:'${object[key]}'}`;

          const newState = state.replace(/\}$/, `,${newProps}`);
          firstElementChild.dataset.state = newState.replace(/^\{\,/, "{");
          firstElementChild.template = template;

          fragment.appendChild(firstElementChild);
        }
      }

      HTMZ.initTree(
        fragment as unknown as HTMLElement,
        node.state,
        node.actions,
        node.plugins
      );

      while (
        (template.nextElementSibling as HTMLElement & { template: Element })
          ?.template
      ) {
        if (
          (
            template.nextElementSibling as HTMLElement & { template: Element }
          ).template.isEqualNode(template)
        ) {
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
        [functionName!]: action.bind(element)(state, rootState, null),
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
        [functionName!]: action.bind(element)(state, rootState, null),
        ...stateValues,
      });
    },
  },
};

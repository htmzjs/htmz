import { HTMZNode, HTMZProp } from "./htmz";
import type { Actions } from "./state";

type InitTreeHandlers = Record<
  string,
  (
    data: { key: string; value: string },
    node: HTMZNode,
    state: Record<string, HTMZProp<unknown>>,
    actions: Actions<{}>
  ) => void
>;

export const initTreeHandlers: InitTreeHandlers = {
  text: (data, node, state, actions) => {
    const keys = data.value.match(/(\$\{[\w-]+)\}/g) ?? [];

    for (const key of keys) {
      const prop = state[key.replace(/[${}]/g, "")];

      if (!prop) continue;
      node.handler.push("text");
      prop.addNode(node);
    }
  },
  range: (data, node, state, actions) => {
    const range = Number(data.value);
    const fragment = document.createDocumentFragment();
    let i = 0;
    while (i++ < range) {
      fragment.appendChild(
        (node.element as HTMLTemplateElement).content.cloneNode(true)
      );
    }
    node.element.parentElement!.appendChild(fragment);
  },
  if: (data, node) => {
    node.handler.push(data.key);
  },
};

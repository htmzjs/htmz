import { HTMZNode } from "./htmz";

export type InitHandler = (
  data: { key: string; value: string },
  node: HTMZNode
) => void;

type InitHandlers = Record<string, InitHandler>;

export const initHandlers: InitHandlers = {
  text: (data, node) => {
    const keys = data.value.match(/(\$\{[\w-]+)\}/g) ?? [];

    for (const key of keys) {
      const prop = node.state[key.replace(/[${}]/g, "")];

      if (!prop) continue;
      node.handlerKeys.push(data.key);
      prop.addNode(node);
    }
  },
  range: (data, node) => {
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
    node.handlerKeys.push(data.key);
  },
};

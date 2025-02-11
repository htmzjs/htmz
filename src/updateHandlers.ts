import type { HTMZNode } from "./htmz";
import { evaluate } from "./utils";

export type updateHandler = (node: HTMZNode) => void;

export const updateHandlers: Record<string, updateHandler> = {
  text: ({ element, stateValue }) => {
    const text = element.dataset.text ?? "";
    const textContent = evaluate(`return \`${text}\``, {
      ...stateValue,
    });
    element.innerText = textContent;
  },
  if: ({ element, state, stateValue, actions }) => {
    const value = element.dataset.if;
    const [condition, func] = value!.split(";") ?? ["false", ""];
    const [functionName] = func!.trim().split("(");
    const action = actions[functionName!];
    if (!action) return;
    evaluate(`if(${condition})${func}`, {
      [functionName!]: action.bind(element)(state, null),
      ...stateValue,
    });
  },
};

import { initTreeHandlers } from "./handler";
import { HTMZNode, HTMZProp } from "./htmz";
import type { Actions, State } from "./state";
import * as state from "./state";
import { evaluate } from "./utils";

export const Store = state.Store;

export class HTMZ {
  static initTree<T extends {}>(
    element: HTMLElement,
    state: State<T>,
    actions: Actions<T> | (() => Actions<T>)
  ) {
    const walker = document.createTreeWalker(element);
    const newActions =
      typeof actions == "function" ? (actions as Function)() : actions;
    const stateValue = Object.entries<HTMZProp<unknown>>(state).reduce(
      (p, [key, value]) => ({ ...p, [key]: value.value }),
      {}
    );

    while (walker.nextNode()) {
      const currentNode = walker.currentNode!;

      if (currentNode instanceof HTMLElement) {
        const node = new HTMZNode(currentNode, stateValue, actions as {});

        const watch = currentNode.dataset?.watch ?? "";
        if (watch) {
          const props = watch.split(",") ?? [];
          for (const prop of props) {
            state[prop as keyof typeof state]!.addNode(node);
          }
        }

        for (const [key, value] of Object.entries(currentNode.dataset)) {
          if (key.startsWith("on")) {
            const event = key as keyof GlobalEventHandlers;
            if (typeof currentNode[event] == "undefined") continue;

            const [functionName] = value?.split("(") ?? [""];
            const action = newActions[functionName!];

            if (!action) continue;
            currentNode[event] = function (event: unknown) {
              evaluate(value ?? "", {
                [functionName!]: action.bind(currentNode)(state, event),
                ...state,
              });
            };
          } else {
            const handler = initTreeHandlers[key];
            if (!handler) continue;
            handler({ key, value: value ?? "" }, node, state, actions as {});
          }
        }
      }
    }
  }
}

// const appState = Store.setState<{ name: string; count: number; msg: string }>({
//   name: "john",
//   count: 6,
//   msg: "hello world",
// });

// HTMZ.initTree(app, appState, () => {
//   return {
//     increment: (state) => {
//       state.count.value += 1;
//     },
//     toggleHidden: function (state) {
//       return (count: number) => {
//         if (count % 5 == 0) {
//           this.hidden = !this.hidden;
//         }
//       };
//     },
//   };
// });

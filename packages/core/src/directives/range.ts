import { init } from "../htmz";
import { interpolate } from "../utils";
import type { Directives } from "."
import type { NodeWithScopes } from "../htmz";

export default {
  range: ({ element, value, directives, watch, scopedState, components }) => {
    const template = element as HTMLTemplateElement;

    let update: ((f: DocumentFragment) => void) | null = null;

    watch(() => {
      const [number, variableName] = value.split(/\s+as\s+/);

      const limit = +interpolate(number, scopedState)
      const fragment = document.createDocumentFragment();

      if (Number.isNaN(limit)) throw new Error(`'${number}' is not type of number`)

      let i = 0;
      while (i < limit) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild =
          content.firstElementChild as NodeWithScopes & {
            template: HTMLTemplateElement;
          };

        const outerRange = (scopedState[
          "$range" as keyof object
        ] as number[]) ?? [0, 0];

        if (!firstElementChild.scopes) firstElementChild.scopes = [];

        const data: Record<string, unknown> = {
          $index: outerRange[0] * limit + i,
          $range: [i, limit],
        };

        if (variableName) data[variableName] = i;

        firstElementChild.scopes.push(scopedState);
        firstElementChild.scopes.push(data);
        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
        i++;
      }

      if (update) update(fragment);

      if (!template.parentElement) return
      template.parentElement.appendChild(fragment);
    });

    update = (fragment: DocumentFragment) => {
      init(fragment)
        .directives(directives)
        .components(components)
        .walk();
      const tmp = document.createDocumentFragment();

      function nextElementSibling() {
        return template.nextElementSibling as Element & { template: Element };
      }

      while (nextElementSibling()?.template) {
        const nextSibling = nextElementSibling();

        if (nextSibling.template.isEqualNode(template)) {
          tmp.appendChild(nextSibling);
        }
      }
    };
  }
} as Directives

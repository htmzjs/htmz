import json5 from "json5"
import { init } from "../htmz";
import type { Directives } from "."
import type { NodeWithScopes } from "../htmz";

export default {
  for: ({ element, value, directives, watch, scopedState, components }) => {
    const template = element as HTMLTemplateElement;
    let update: ((f: DocumentFragment) => void) | null = null;

    watch(() => {
      const [key, json] = value.split(/\s+in\s+/);
      const object = json5.parse(json)
      const fragment = document.createDocumentFragment();

      for (const k in object) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild =
          content.firstElementChild as NodeWithScopes & {
            template: HTMLTemplateElement;
          };

        const data = { $key: k, [`${key}`]: object[k] };

        if (!firstElementChild.scopes) firstElementChild.scopes = [];

        firstElementChild.scopes.push(scopedState);
        firstElementChild.scopes.push(data);
        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
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
    }
  }
} as Directives

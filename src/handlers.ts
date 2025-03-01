import { Component, type ComponentConstructor } from "./component";
import {
  createEventHandlers,
  globalEventHandlersEvents,
} from "./eventHandlers";
import { init, type NodeWithScopes, type Plugins } from "./htmz";
import { effect, type State } from "./reactive";
import { evalReturn, evaluate, isFunction } from "./utils";

export const handlers: Plugins = {
  component({
    element,
    config,
    win,
    plugins,
    scopedState,
    scopes,
    rootState,
    components,
  }) {
    const value = element.dataset.component ?? "";

    let update = false;

    effect(async function () {
      const componentName = evalReturn(`\`${value}\``).bind(scopedState)();
      let componentConstructor = components[
        componentName
      ] as ComponentConstructor;

      if (isFunction(componentConstructor)) {
        componentConstructor = await (componentConstructor as Function)();
      }

      const component = Component.create(componentConstructor);
      if (update) {
        component.host!.append(...element.firstElementChild!.childNodes);
      } else {
        update = true;
        component.host!.append(...element.childNodes);
      }

      init(component.root!)
        .config({ ...config, ...component._config })
        .state(rootState, ...(scopes ?? []), component.state)
        .plugins({ ...plugins, ...component.plugins })
        .components(Component.components)
        .walk();

      element.replaceChildren(component.host!);
    });
  },
  for({ element, doc, config, plugins, scopedState, components }) {
    const template = element as HTMLTemplateElement;
    const value = element.dataset.for ?? "";

    let update: ((f: DocumentFragment) => void) | null = null;

    effect(function () {
      const [key, json] = value.split(/\s+in\s+/);
      const object = evalReturn(json || "[]").bind(scopedState)();
      const fragment = doc.createDocumentFragment();

      for (const k in object) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild =
          content.firstElementChild as NodeWithScopes & {
            template: HTMLTemplateElement;
          };

        const state = { $key: k, [`${key}`]: object[k] };

        if (!firstElementChild.scopes) firstElementChild.scopes = [];

        firstElementChild.scopes.push(scopedState);
        firstElementChild.scopes.push(state);
        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
      }

      if (update) update(fragment);

      template.parentElement!.appendChild(fragment);
    });

    update = (fragment: DocumentFragment) => {
      init(fragment)
        .config(config)
        .plugins(plugins)
        .components(components)
        .walk();

      const tmp = doc.createDocumentFragment();

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
  },
  if({ element, scopedState }) {
    const value = element.dataset.if;
    const [condition, expression] = value!.split(/\s*\;\s*/) ?? ["false", ""];

    effect(function () {
      evaluate(`if(${condition}){${expression}}`).bind(scopedState)();
    });
  },
  model({ element, scopedState }) {
    const value = element.dataset.model ?? "";

    const handler = function (e: Event) {
      const target = e.target as HTMLInputElement;
      evaluate(`${value} = target.value`).bind(scopedState)({ target });
    };

    const inputElement = element as HTMLInputElement;
    inputElement.value = `${evalReturn(`${value}`).bind(scopedState)()}`;

    element.addEventListener("input", handler);
  },
  range({ element, doc, config, plugins, scopedState, components }) {
    const template = element as HTMLTemplateElement;
    const value = element.dataset.range ?? "";

    let update: ((f: DocumentFragment) => void) | null = null;

    effect(function () {
      const [number, variableName] = value.split(/\s+as\s+/);

      const limit = evalReturn(number ?? "").bind(scopedState)();
      const fragment = doc.createDocumentFragment();

      let i = 0;
      while (i < limit) {
        const content = template.content.cloneNode(true) as DocumentFragment;
        const firstElementChild =
          content.firstElementChild as NodeWithScopes & {
            template: HTMLTemplateElement;
          };

        const outerRange = (scopedState[
          "$range" as keyof State
        ] as number[]) ?? [0, 0];

        if (!firstElementChild.scopes) firstElementChild.scopes = [];

        const state: Record<string, unknown> = {
          $index: outerRange[0]! * limit + i,
          $range: [i, limit],
        };

        if (variableName) state[variableName] = i;

        firstElementChild.scopes.push(scopedState);
        firstElementChild.scopes.push(state);
        firstElementChild.template = template;

        fragment.appendChild(firstElementChild);
        i++;
      }

      if (update) update(fragment);

      template.parentElement!.appendChild(fragment);
    });

    update = (fragment: DocumentFragment) => {
      init(fragment)
        .config(config)
        .plugins(plugins)
        .components(components)
        .walk();
      const tmp = doc.createDocumentFragment();

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
  },
  text({ element, scopedState }) {
    const value = element.dataset.text ?? "";

    effect(function () {
      element.textContent = `${evalReturn(value).bind(scopedState)()}`;
    });
  },

  ...createEventHandlers(globalEventHandlersEvents),
};

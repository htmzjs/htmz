import { init } from "../htmz";
import { interpolate, moveChildNodes, defineComponent, isComponentConstructor } from "../utils";
import type { Directives } from "."
import type { ComponentConstructor, Component } from "../component";

export default {
  component: ({
    element,
    scopedState,
    watch,
    scopes,
    rootState,
    directives,
    components,
    value
  }) => {
    let update: ((c: Component) => void) | null = null;

    watch(async () => {
      const componentName = interpolate(value, scopedState)
      const componentConstructor = components[componentName]
      if (!componentConstructor) throw new Error(`Component '${value}' is not defined`)

      let constr = componentConstructor as ComponentConstructor

      if (!isComponentConstructor(componentConstructor)) {
        constr = await componentConstructor()
      }

      defineComponent(constr)

      const component = new constr();
      if (!component.root) throw new Error(`Property 'root' on component '${value}' is undefined`)

      init(component.root)
        .data(rootState, ...(scopes ?? []), component.data)
        .components({ ...components, ...constr.components })
        .directives({ ...directives, ...constr.directives })
        .walk();

      if (update) return update(component)
      moveChildNodes(component, element.childNodes)

      element.replaceChildren(component);
    })

    update = (component) => {
      if (element.firstElementChild) {
        moveChildNodes(component, element.firstElementChild.childNodes)
      }
      element.replaceChildren(component)
    }
  }
} as Directives

import * as htmz from "@htmzjs/core"
import { matchDynamicRoute } from "./utils"

export type Params = Record<string, unknown>

export type Path = `/${string}`

export type Routes = Record<Path, {
  component: htmz.ComponentConstructor,
  params?: Params
} | {
  /* eslint-disable */
  /* biome-ignore lint/suspicious/noExplicitAny:*/
  component: (this: { params: any }) => Promise<htmz.ComponentConstructor>,
  params?: Params
}
>

const directives: htmz.Directives = {
  "router-view": ({ rootState, scopes, watch, components, element }) => {
    let update: ((c: htmz.Component) => void) | null = null;

    const fragmentChildNodes = document.createDocumentFragment()
    fragmentChildNodes.append(...element.childNodes)

    watch(async () => {
      const componentConstructor = Router.components.view
      if (!componentConstructor) return

      let constr = componentConstructor as htmz.ComponentConstructor
      if (!htmz.isComponentConstructor(componentConstructor)) {
        constr = await componentConstructor.bind({ params: Router.params })()
      }

      htmz.defineComponent(constr)

      const component = new constr();
      if (!component.root) throw new Error("property `root` on routerview component is undefined")

      htmz.init(component.root)
        .data(rootState, ...(scopes ?? []), component.data, { $params: Router.params })
        .components({ ...components, ...constr.components })
        .directives({ ...directives, ...constr.directives })
        .walk();

      if (update) return update(component)
      htmz.moveChildNodes(component, element.childNodes)

      element.replaceChildren(component);
    })

    update = (component) => {
      if (element.firstElementChild) {
        htmz.moveChildNodes(component, element.firstElementChild.childNodes)
      }
      element.replaceChildren(component)
    }
  }
}

class Router {
  static params = {}
  static loading: htmz.ComponentConstructor | null = null
  static routes: Routes = {}
  static components: htmz.Components = htmz.observe({})
  static app: htmz.Component

  constructor(app: htmz.ComponentConstructor) {
    htmz.defineComponent(app)
    Router.app = new app()

    if (!Router.app.root) {
      throw new Error(`Property 'root' on ${app.name} is undefined`)
    }
    htmz
      .init(Router.app.root)
      .directives(directives)
      .walk()
  }

  routes(routes: Routes) {
    Router.routes = routes
    return this
  }

  mount(selectors: string | HTMLElement) {
    const root =
      selectors instanceof Element
        ? selectors
        : document.querySelector(selectors);
    if (!root) {
      throw new Error(`Cannot mount, element not found for selector ${selectors}`)
    }

    root.appendChild(Router.app);
    Router.navigate(window.location.pathname as Path);
    window.addEventListener("popstate", () => {
      const path = window.location.pathname as Path;
      Router.navigate(path, null, "none");
    });
  }

  private static navigateType = {
    replace(path: Path, data: unknown) {
      window.history.replaceState(data, "", path);
    },
    push(path: Path, data: unknown) {
      window.history.pushState(data, "", path);
    },
    back() {
      window.history.back();
    },
    none() { return },
  };

  static navigate(
    path?: Path,
    data: unknown = null,
    type: keyof typeof Router.navigateType = "push"
  ) {
    const route = (Router.routes[path as Path]
      ?? matchDynamicRoute(Router.routes, path)) as Routes[Path]

    Router.params = route?.params ?? {};
    Router.components.view = route.component;
    Router.navigateType[type](path ?? "/", data);
  }
}

export function initRouter(app: htmz.ComponentConstructor) {
  return new Router(app);
}

export function navigate(url?: Path, data: unknown = null) {
  Router.navigate(url, data);
}

